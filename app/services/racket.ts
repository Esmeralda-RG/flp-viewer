import type { ASTNode } from '@/app/types/ast'
import type { EnvFrame, Binding } from '@/app/types/environment'
import type { EditorFileLike, StepResult, TraceResult } from '@/app/types/racket'
export type { EditorFileLike, StepResult, TraceResult }

// Re-export for legacy consumers
export type { ASTNode, EnvFrame, Binding }

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
    return { type: JSON.stringify(v) }
  }
  return { type: String(v) }
}

// ── Environment conversion ────────────────────────────────────────────────────

export function valueToString(v: unknown): string {
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
    return JSON.stringify(v)
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
    const frames: Binding[][] = (s.frames ?? []).map(frame =>
      Object.entries(frame).map(([name, val]) => ({
        name, value: valueToString(val), type: valueType(val),
      }))
    )
    const label = s.tag === 'empty-env' ? 'empty-env'
                : s.tag === 'init-env'  ? 'init-env'
                : 'extend'
    return { label, frames }
  })
}

function parseStep(raw: unknown): StepResult {
  const s = raw as Record<string, unknown>
  return {
    ast: toASTNode(s.ast),
    output: valueToString(s.output),
    environments: Array.isArray(s.environments) ? toEnvFrames(s.environments) : [],
  }
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

  const empty: TraceResult = {
    stdout: '', stderr: '', error: null,
    steps: [], ast: null, environments: [], output: null,
  }

  if (!res.ok) {
    return { ...empty, stderr: `HTTP ${res.status}: ${res.statusText}`, error: res.statusText }
  }

  const data = (await res.json()) as {
    stdout: string
    stderr: string
    error: string | null
    steps?: unknown[] | null
  }

  const steps = Array.isArray(data.steps) ? data.steps.map(parseStep) : []
  const last = steps.at(-1) ?? null

  return {
    stdout: data.stdout ?? '',
    stderr: data.stderr ?? '',
    error: data.error,
    steps,
    ast: last?.ast ?? null,
    environments: last?.environments ?? [],
    output: last?.output ?? null,
  }
}
