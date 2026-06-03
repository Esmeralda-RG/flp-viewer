import type { InitBinding } from '@/app/types/grammar'
export type { InitBinding }

export function inferType(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return 'number'
  if (/^".*"$/.test(value)) return 'string'
  if (value === '#t' || value === '#f') return 'boolean'
  if (value.startsWith("'(")) return 'list'
  if (/^'[a-zA-Z]/.test(value)) return 'symbol'
  return 'value'
}

export function parseInitEnv(content: string): InitBinding[] {
  const match = new RegExp(/\(define\s+init-env[\s\S]*?extend-env\s+'\(([^)]*)\)\s+'\(([^)]*)\)/).exec(content)
  if (!match) return []
  const names  = match[1].trim().split(/\s+/).filter(Boolean)
  const values = match[2].trim().split(/\s+/).filter(Boolean)
  return names.map((name, i) => ({ name, value: values[i] ?? '0' }))
}

export function generateInitEnvDef(bindings: InitBinding[]): string {
  if (bindings.length === 0) {
    return `(define init-env\n  (lambda ()\n    (empty-env)))`
  }
  const names  = bindings.map(b => b.name).join(' ')
  const values = bindings.map(b => b.value).join(' ')
  return `(define init-env\n  (lambda ()\n    (extend-env\n     '(${names})\n     '(${values})\n     (empty-env))))`
}

export function updateInitEnvInContent(content: string, bindings: InitBinding[]): string {
  const newDef = generateInitEnvDef(bindings)
  // Captura todos los paréntesis de cierre después de (empty-env) — greedy para ))), ))) o ))))
  return content.replace(
    /\(define\s+init-env[\s\S]*?\(empty-env\)(\s*\))+/,
    newDef
  )
}
