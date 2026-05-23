'use client'

import { useState } from 'react'

export interface ASTNode {
  type: string
  value?: string | number | boolean
  children?: ASTNode[]
}

// ── Color by node type ────────────────────────────────────────────────────────

function nodeBadgeClass(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('lit') || t.includes('num') || t.includes('val') || t.includes('const'))
    return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
  if (t.includes('ident') || t.includes('var') || t.includes('name') || t.includes('sym'))
    return 'bg-violet-900/50 text-violet-300 border border-violet-700/40'
  if (t.includes('if') || t.includes('cond') || t.includes('when') || t.includes('else'))
    return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/40'
  if (t.includes('call') || t.includes('apply') || t.includes('invoke'))
    return 'bg-orange-900/50 text-orange-300 border border-orange-700/40'
  if (t.includes('let') || t.includes('decl') || t.includes('def') || t.includes('bind'))
    return 'bg-pink-900/50 text-pink-300 border border-pink-700/40'
  if (t.includes('lambda') || t.includes('func') || t.includes('proc') || t.includes('closure'))
    return 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/40'
  if (t.includes('program') || t.includes('root') || t.includes('module'))
    return 'bg-zinc-700/60 text-zinc-200 border border-zinc-600/40'
  return 'bg-blue-900/50 text-blue-300 border border-blue-700/40'
}

// ── Tree row ──────────────────────────────────────────────────────────────────

const ROW_H = 30

type ExpandMode = 'partial' | 'all' | 'none'

interface RowProps {
  node: ASTNode
  depth: number
  guides: boolean[]   // for each ancestor: should we draw a vertical guide?
  isLast: boolean
  isRoot: boolean
  expandMode: ExpandMode
}

function TreeRow({ node, depth, guides, isLast, isRoot, expandMode }: Readonly<RowProps>) {
  const [open, setOpen] = useState<boolean>(() => {
    if (expandMode === 'all') return true
    if (expandMode === 'none') return false
    return depth < 2
  })

  const hasKids = !!node.children?.length

  return (
    <>
      {/* ── Row ── */}
      <div className="flex items-center min-w-max group" style={{ height: ROW_H }}>

        {/* Ancestor guide lines */}
        {guides.map((active, i) => (
          <div key={i} className="shrink-0 flex justify-center" style={{ width: 20, height: ROW_H }}>
            {active && <div className="w-px h-full bg-zinc-700/70" />}
          </div>
        ))}

        {/* Connector to parent */}
        {!isRoot && (
          <div className="shrink-0 relative" style={{ width: 20, height: ROW_H }}>
            {/* Vertical top */}
            <div className="absolute bg-zinc-700/70" style={{ left: 9, top: 0, width: 1, height: ROW_H / 2 }} />
            {/* Vertical bottom (only if not last sibling) */}
            {!isLast && (
              <div className="absolute bg-zinc-700/70" style={{ left: 9, top: ROW_H / 2, width: 1, height: ROW_H / 2 }} />
            )}
            {/* Horizontal */}
            <div className="absolute bg-zinc-700/70" style={{ left: 10, top: ROW_H / 2 - 0.5, width: 10, height: 1 }} />
          </div>
        )}

        {/* Expand / leaf indicator */}
        <button
          type="button"
          onClick={() => hasKids && setOpen(o => !o)}
          disabled={!hasKids}
          className={[
            'shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] mr-1.5 transition-colors',
            hasKids
              ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10 cursor-pointer'
              : 'invisible',
          ].join(' ')}
          aria-label={open ? 'Colapsar' : 'Expandir'}
        >
          {open ? '▾' : '▸'}
        </button>

        {/* Node type badge */}
        <span className={`shrink-0 px-1.5 py-px rounded text-[11px] font-mono font-medium ${nodeBadgeClass(node.type)}`}>
          {node.type}
        </span>

        {/* Value */}
        {node.value !== undefined && (
          <span className="ml-2 text-xs text-amber-300/90 font-mono">
            {typeof node.value === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        )}

        {/* Collapsed children count hint */}
        {hasKids && !open && (
          <span className="ml-2 text-[10px] text-zinc-600 select-none">
            ({node.children!.length})
          </span>
        )}
      </div>

      {/* ── Children ── */}
      {hasKids && open && node.children!.map((child, i) => (
        <TreeRow
          key={`${depth}-${i}-${child.type}`}
          node={child}
          depth={depth + 1}
          guides={isRoot ? [] : [...guides, !isLast]}
          isLast={i === node.children!.length - 1}
          isRoot={false}
          expandMode={expandMode}
        />
      ))}
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

interface ASTViewerProps {
  ast: ASTNode | null
}

export default function ASTViewer({ ast }: Readonly<ASTViewerProps>) {
  const [treeKey, setTreeKey] = useState(0)
  const [expandMode, setExpandMode] = useState<ExpandMode>('partial')

  function resetWith(mode: ExpandMode) {
    setExpandMode(mode)
    setTreeKey(k => k + 1)
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">AST</span>
        {ast && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => resetWith('all')}
              className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors"
            >
              expandir todo
            </button>
            <button
              type="button"
              onClick={() => resetWith('none')}
              className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors"
            >
              colapsar todo
            </button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2 pl-3">
        {ast ? (
          <TreeRow
            key={treeKey}
            node={ast}
            depth={0}
            guides={[]}
            isLast={true}
            isRoot={true}
            expandMode={expandMode}
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
