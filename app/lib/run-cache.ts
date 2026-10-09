import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, rename, rm, stat, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const CACHE_ROOT = join(tmpdir(), 'flp-cache')

const MAX_ENTRIES = Number(process.env.RACKET_CACHE_MAX) || 100
const BUILD_PREFIX = 'build-'

// Expandir los módulos del estudiante (#lang eopl) es ~70% del costo de una
// ejecución. El directorio ya compilado se reutiliza mientras el contenido de
// los archivos no cambie (p. ej. al probar otro testInput sobre el mismo intérprete).
export function cacheKey(files: Array<{ name: string; content: string }>, runtime: string[]): string {
  const hash = createHash('sha256')
  for (const r of runtime) hash.update(r).update('\0')
  for (const f of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    hash.update(f.name).update('\0').update(f.content).update('\0')
  }
  return hash.digest('hex')
}

// La primera vez que llega un contenido se ejecuta sin compilar a disco (compilar
// con cache cuesta ~30% más que ejecutar directo); solo si se repite vale la pena.
const seen = new Set<string>()
const MAX_SEEN = 1000

export function seenBefore(key: string): boolean {
  if (seen.has(key)) return true
  if (seen.size >= MAX_SEEN) seen.delete(seen.values().next().value as string)
  seen.add(key)
  return false
}

export async function createBuildDir(): Promise<string> {
  await mkdir(CACHE_ROOT, { recursive: true })
  return mkdtemp(join(CACHE_ROOT, BUILD_PREFIX))
}

export async function getCachedDir(key: string): Promise<string | null> {
  const dir = join(CACHE_ROOT, key)
  try {
    await stat(dir)
    const now = new Date()
    await utimes(dir, now, now).catch(() => {})
    return dir
  } catch {
    return null
  }
}

// Devuelve el directorio definitivo, o null si otra petición ganó la carrera
// (en ese caso el llamador sigue usando su propio directorio de build).
export async function storeBuildDir(key: string, buildDir: string): Promise<string | null> {
  const dir = join(CACHE_ROOT, key)
  try {
    await rename(buildDir, dir)
    void pruneCache()
    return dir
  } catch {
    return null
  }
}

async function pruneCache(): Promise<void> {
  try {
    const names = (await readdir(CACHE_ROOT)).filter((n) => !n.startsWith(BUILD_PREFIX))
    if (names.length <= MAX_ENTRIES) return
    const entries = await Promise.all(
      names.map(async (n) => ({ n, t: (await stat(join(CACHE_ROOT, n)).catch(() => null))?.mtimeMs ?? 0 })),
    )
    entries.sort((a, b) => a.t - b.t)
    await Promise.all(
      entries.slice(0, names.length - MAX_ENTRIES).map((e) => rm(join(CACHE_ROOT, e.n), { recursive: true, force: true })),
    )
  } catch {
    // la poda es best-effort
  }
}
