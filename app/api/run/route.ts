import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync } from 'node:fs'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import type { EditorFileLike } from '@/app/types/racket'

const execFileAsync = promisify(execFile)

const RACKET_BIN =
  process.env.RACKET_BIN ??
  '/Applications/Racket v9.1/bin/racket'

const RKT_DIR = join(process.cwd(), 'app/api/run')
const RUNNER_RKT      = readFileSync(join(RKT_DIR, '_runner.rkt'), 'utf8')
const TRACKING_BLOCK  = readFileSync(join(RKT_DIR, '_tracking.rkt'), 'utf8')
const STREAM_PARSER_BLOCK = readFileSync(join(RKT_DIR, '_stream-parser.rkt'), 'utf8')

// f.name viene del cliente: rechaza cualquier valor que no sea un nombre de archivo
// plano (sin '..' ni separadores de ruta) para evitar escribir fuera del tmpdir.
function isSafeFileName(name: string): boolean {
  return name.length > 0 && name !== '.' && name !== '..' && basename(name) === name
}

function injectRuntime(name: string, content: string): string {
  if (name === 'environment.rkt') return content + TRACKING_BLOCK
  if (name === 'main.rkt') return content + STREAM_PARSER_BLOCK
  return content
}

// Elimina la sección verbose "context...: / location..." del stderr de Racket
function cleanStderr(raw: string): string {
  const lines = raw.split('\n')
  const kept: string[] = []
  for (const line of lines) {
    if (/^\s+(context|location)\.\.\.:/.test(line)) break
    if (/^\s+\[repeats \d+ more/.test(line)) continue
    kept.push(line)
  }
  return kept.join('\n').trim()
}

export async function POST(request: Request) {
  let tmpDir: string | null = null

  try {
    const body = (await request.json()) as {
      files?: EditorFileLike[]
      testInput?: string
    }

    const files = body.files ?? []
    const testInput = (body.testInput ?? 'void').trim() || 'void'

    if (files.length === 0) {
      return Response.json({ stdout: '', stderr: 'No hay archivos para ejecutar.', error: 'No files' })
    }

    const invalidFile = files.find((f) => !isSafeFileName(f.name))
    if (invalidFile) {
      return Response.json({ stdout: '', stderr: `Nombre de archivo inválido: ${invalidFile.name}`, error: 'Invalid file name' })
    }

    tmpDir = await mkdtemp(join(tmpdir(), 'flp-'))

    await Promise.all(files.map((f) => writeFile(join(tmpDir!, f.name), injectRuntime(f.name, f.content), 'utf8')))
    await writeFile(join(tmpDir, '_runner.rkt'), RUNNER_RKT, 'utf8')

    const { stdout, stderr } = await execFileAsync(
      RACKET_BIN,
      [join(tmpDir, '_runner.rkt'), testInput],
      {
        timeout: 15_000,
        signal: request.signal,
        env: { ...process.env, PLTDISABLE_BROWSER_REDIRECT: '1' },
      },
    )

    let steps: unknown[] | null = null
    try {
      const parsed = JSON.parse(stdout.trim())
      if (Array.isArray(parsed)) steps = parsed
    } catch {
      // no es JSON — salida de texto plano de Racket
    }

    return Response.json({
      stdout: steps ? '' : stdout.trim(),
      stderr: cleanStderr(stderr),
      error: null,
      steps,
    })
  } catch (err: unknown) {
    if (request.signal.aborted) return new Response(null, { status: 499 })

    const e = err as NodeJS.ErrnoException & {
      killed?: boolean
      stderr?: string
      stdout?: string
    }
    const rawStderr = (e.stderr ?? '').trim()
    const error = e.killed
      ? 'Tiempo de ejecución agotado (> 15 s)'
      : (e.message ?? 'Error desconocido')

    return Response.json({
      stdout: (e.stdout ?? '').trim(),
      stderr: cleanStderr(rawStderr) || error,
      error,
      trace: null,
    })
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
