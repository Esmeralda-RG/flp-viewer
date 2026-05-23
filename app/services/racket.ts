import type { ASTNode } from '@/app/components/ASTViewer'
import type { EnvFrame, Binding } from '@/app/components/EnvironmentPanel'

export interface EditorFileLike {
  name: string
  content: string
}

export interface TraceResult {
  stdout: string
  stderr: string
  error: string | null
  ast: ASTNode | null
  environments: EnvFrame[]
  output: string | null
}

// ── AST conversion ────────────────────────────────────────────────────────────

function toASTNode(v: unknown): ASTNode | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'boolean') return { type: 'boolean', value: v }
  if (typeof v === 'number') return { type: 'number', value: v }
  if (typeof v === 'string') return { type: 'string', value: v }
  if (Array.isArray(v)) {
    const children = v.map(toASTNode).filter((n): n is ASTNode => n !== null)
    if (children.length === 0) return { type: 'list' }
    return { type: 'list', children }
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj.type === 'string') {
      const fields = Array.isArray(obj.fields) ? obj.fields : []
      const children = fields
        .map(toASTNode)
        .filter((n): n is ASTNode => n !== null)
      return {
        type: obj.type,
        children: children.length > 0 ? children : undefined,
      }
    }
  }
  return { type: String(v) }
}

// ── Environment conversion ────────────────────────────────────────────────────

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    return `[${v.map(valueToString).join(', ')}]`
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj.type === 'string') return `<${obj.type}>`
  }
  return String(v)
}

function valueType(v: unknown): string {
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'string') return 'string'
  if (Array.isArray(v)) return 'list'
  if (typeof v === 'object' && v !== null) {
    const obj = v as Record<string, unknown>
    if (obj.type === 'procedure') return 'lambda'
    if (obj.type === 'void') return 'void'
    return 'struct'
  }
  return 'unknown'
}

interface RawSnapshot {
  tag: string
  frames: Record<string, unknown>[]
}

function toEnvFrames(raw: unknown[]): EnvFrame[] {
  return raw.map((snap, i) => {
    const s = snap as RawSnapshot
    const scopes: Binding[][] = (s.frames ?? []).map(frame =>
      Object.entries(frame).map(([name, val]) => ({
        name, value: valueToString(val), type: valueType(val),
      }))
    )
    return {
      label: `#${i + 1} (${s.tag ?? 'extend'})`,
      bindings: scopes.flat(),
      scopes,
    }
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runTrace(
  files: EditorFileLike[],
  testInput: string,
  signal?: AbortSignal,
): Promise<TraceResult> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, testInput }),
    signal,
  })

  if (!res.ok) {
    return {
      stdout: '',
      stderr: `HTTP ${res.status}: ${res.statusText}`,
      error: res.statusText,
      ast: null,
      environments: [],
      output: null,
    }
  }

  const data = (await res.json()) as {
    stdout: string
    stderr: string
    error: string | null
    trace?: Record<string, unknown> | null
  }

  const trace = data.trace
  const ast = trace ? toASTNode(trace.ast) : null
  const environments = trace && Array.isArray(trace.environments)
    ? toEnvFrames(trace.environments)
    : []
  const output = trace ? valueToString(trace.output) : null

  return {
    stdout: data.stdout ?? '',
    stderr: data.stderr ?? '',
    error: data.error,
    ast,
    environments,
    output,
  }
}
