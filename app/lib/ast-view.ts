import type { ASTNode, ASTCategory } from '@/app/types/ast'

export const ROW_H = 30
export const GUIDE_W = 20

export function normalize(node: ASTNode): ASTNode {
  const kids = (node.children ?? [])
    .map(normalize)
    .filter(k => !(k.type === 'list' && !k.children?.length))

  if (kids.length === 1) {
    const c = kids[0]
    if ((c.type === 'string' || c.type === 'number' || c.type === 'boolean') && c.value !== undefined)
      return { type: node.type, value: c.value }
  }

  if ((node.type === 'num-exp' || node.type === 'decl-exp' || node.type === 'bool-exp') && kids.length === 1)
    return kids[0]

  if (node.type === 'list' && kids.length === 1) return kids[0]

  return { ...node, children: kids.length ? kids : undefined }
}

export function categorize(type: string): ASTCategory {
  const t = type.toLowerCase()
  if (t === 'a-program' || t === 'a-programa') return 'program'
  if (t === 'var-let-exp' || t === 'let-exp' || t === 'letrec-exp' || t === 'decl-exp') return 'decl'
  if (t === 'if-exp') return 'cond'
  if (t === 'call-exp') return 'call'
  if (t === 'func-exp' || t === 'proc-exp') return 'func'
  if (t === 'var-exp' || t === 'string') return 'var'
  if (t === 'decimal-num' || t === 'float-num' || t === 'number' || t === 'lit-exp') return 'num'
  if (t === 'true-exp' || t === 'false-exp' || t === 'boolean') return 'bool'
  if (t.endsWith('-prim') || t === 'prim-num-exp' || t === 'prim-bool-exp' || t === 'diff-exp' || t === 'zero?-exp') return 'op'
  return 'other'
}

export const CAT: Record<ASTCategory, { border: string; icon: string; ic: string; tc: string; bg: string; bgHover: string }> = {
  program: { border: '#71717a', icon: '◆', ic: '#a1a1aa', tc: '#e4e4e7', bg: '#27272a',  bgHover: '#3f3f46' },
  decl:    { border: '#f43f5e', icon: 'D',  ic: '#fb7185', tc: '#fda4af', bg: '#4c0519',  bgHover: '#881337' },
  cond:    { border: '#eab308', icon: '?',  ic: '#facc15', tc: '#fef08a', bg: '#422006',  bgHover: '#713f12' },
  call:    { border: '#f97316', icon: '()', ic: '#fb923c', tc: '#fdba74', bg: '#431407',  bgHover: '#7c2d12' },
  func:    { border: '#06b6d4', icon: 'ƒ',  ic: '#22d3ee', tc: '#67e8f9', bg: '#082f49',  bgHover: '#0c4a6e' },
  var:     { border: '#8b5cf6', icon: '$',  ic: '#a78bfa', tc: '#c4b5fd', bg: '#2e1065',  bgHover: '#4c1d95' },
  num:     { border: '#22c55e', icon: '#',  ic: '#4ade80', tc: '#86efac', bg: '#052e16',  bgHover: '#14532d' },
  bool:    { border: '#f59e0b', icon: '!',  ic: '#fbbf24', tc: '#fcd34d', bg: '#451a03',  bgHover: '#78350f' },
  op:      { border: '#6366f1', icon: '±',  ic: '#818cf8', tc: '#a5b4fc', bg: '#1e1b4b',  bgHover: '#312e81' },
  other:   { border: '#3b82f6', icon: '·',  ic: '#60a5fa', tc: '#93c5fd', bg: '#172554',  bgHover: '#1e3a8a' },
}

export function renderValue(value: string | number | boolean): string {
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value ? '#t' : '#f'
  return String(value)
}
