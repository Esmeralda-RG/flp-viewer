'use client'

import { useState, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

import type { ASTNode } from '@/app/types/ast'
export type { ASTNode }

// ── Normalize — strip SLLGEN noise, extract leaf values ───────────────────────

function normalize(node: ASTNode): ASTNode {
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

// ── Node category → visual style ──────────────────────────────────────────────

type Cat = 'program' | 'decl' | 'cond' | 'call' | 'func' | 'var' | 'num' | 'bool' | 'op' | 'other'

function categorize(type: string): Cat {
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

const CAT: Record<Cat, { border: string; icon: string; ic: string; tc: string; bg: string; bgHover: string }> = {
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

// ── Value display ─────────────────────────────────────────────────────────────

function renderValue(value: string | number | boolean): string {
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return value ? '#t' : '#f'
  return String(value)
}

// ── Tree node ─────────────────────────────────────────────────────────────────

const ROW_H = 30
const GUIDE_W = 20

interface NodeProps {
  node: ASTNode
  depth: number
  isLast: boolean
  guides: boolean[]
  initialOpen: boolean
}

function TreeNode({ node, depth, isLast, guides, initialOpen }: Readonly<NodeProps>) {
  const [open, setOpen] = useState(initialOpen)
  const [hovered, setHovered] = useState(false)

  const hasKids = !!node.children?.length
  const isLeaf = !hasKids
  const cat = categorize(node.type)
  const s = CAT[cat]
  const openIndicator =  open ? '▾' : '▸';
  const chevron = hasKids ? openIndicator : '·'

  return (
    <div>
      { }
      <div
        className="flex items-center"
        style={{ height: ROW_H, minWidth: 'max-content' }}
      >

        { }
        {guides.map((active, gi) => (
          <div key={`guide-${gi}:${active}`} className="shrink-0 relative" style={{ width: GUIDE_W, height: ROW_H }}>
            {active && (
              <div
                className="absolute"
                style={{ left: 9, top: 0, bottom: 0, width: 1, background: '#3f3f46' }}
              />
            )}
          </div>
        ))}

        { }
        {depth > 0 && (
          <div className="shrink-0 relative" style={{ width: GUIDE_W, height: ROW_H }}>
            <div className="absolute" style={{ left: 9, top: 0, height: ROW_H / 2, width: 1, background: '#3f3f46' }} />
            {!isLast && (
              <div className="absolute" style={{ left: 9, top: ROW_H / 2, bottom: 0, width: 1, background: '#3f3f46' }} />
            )}
            <div className="absolute" style={{ left: 10, top: ROW_H / 2 - 0.5, right: 0, height: 1, background: '#3f3f46' }} />
          </div>
        )}

        { }
        <button
          type="button"
          onClick={() => hasKids && setOpen(o => !o)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 10px 2px 8px',
            borderRadius: 6,
            borderLeft: `2px solid ${s.border}`,
            background: hovered ? s.bgHover : s.bg,
            cursor: hasKids ? 'pointer' : 'default',
            opacity: isLeaf ? 0.85 : 1,
            transition: 'background 120ms ease, opacity 120ms ease',
            userSelect: 'none',
          }}
        >
          { }
          <span style={{ width: 10, fontSize: 9, color: '#71717a', fontFamily: 'monospace', flexShrink: 0 }}>
            {chevron}
          </span>

          { }
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: s.ic, flexShrink: 0, minWidth: 14, textAlign: 'center' }}>
            {s.icon}
          </span>

          { }
          <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: s.tc, flexShrink: 0 }}>
            {node.type}
          </span>

          { }
          {node.value !== undefined && (
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#fcd34d', flexShrink: 0 }}>
              {renderValue(node.value)}
            </span>
          )}

          { }
          {hasKids && !open && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', flexShrink: 0 }}>
              ({node.children!.length})
            </span>
          )}
        </button>
      </div>

      { }
      {hasKids && (
        <div
          style={{
            display: 'grid',
            gridTemplateRows: open ? '1fr' : '0fr',
            transition: 'grid-template-rows 180ms ease',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            {node.children!.map((child, i) => (
              <TreeNode
                key={`${depth}-${i}-${child.type}`}
                node={child}
                depth={depth + 1}
                isLast={i === node.children!.length - 1}
                guides={depth === 0 ? [] : [...guides, !isLast]}
                initialOpen={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

interface ASTViewerProps {
  ast: ASTNode | null
}

type ExpandMode = 'partial' | 'all' | 'none'

export default function ASTViewer({ ast }: Readonly<ASTViewerProps>) {
  const [treeKey, setTreeKey] = useState(0)
  const [mode, setMode] = useState<ExpandMode>('partial')

  useEffect(() => {
    setMode('partial')
    setTreeKey(k => k + 1)
  }, [ast])

  function applyMode(m: ExpandMode) {
    setMode(m)
    setTreeKey(k => k + 1)
  }

  const root = ast ? normalize(ast) : null

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">

      { }
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">AST</span>
        {root && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => applyMode('all')}
              className="text-[10px] px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            >
              expandir todo
            </button>
            <button
              type="button"
              onClick={() => applyMode('none')}
              className="text-[10px] px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            >
              colapsar todo
            </button>
          </div>
        )}
      </div>

      { }
      <div className="flex-1 overflow-auto p-3">
        {root ? (
          <TreeNode
            key={treeKey}
            node={root}
            depth={0}
            isLast={true}
            guides={[]}
            initialOpen={mode !== 'none'}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-600">Ejecuta el código para ver el AST</p>
          </div>
        )}
      </div>

    </div>
  )
}
