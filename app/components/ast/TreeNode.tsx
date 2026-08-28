'use client'

import { useState } from 'react'
import type { TreeNodeProps } from '@/app/types/props'
import { categorize, renderValue, CAT, ROW_H, GUIDE_W } from '@/app/lib/ast-view'

export default function TreeNode({ node, depth, isLast, guides, initialOpen }: Readonly<TreeNodeProps>) {
  const [open, setOpen] = useState(initialOpen)
  const [hovered, setHovered] = useState(false)

  const hasKids = !!node.children?.length
  const isLeaf = !hasKids
  const cat = categorize(node.type)
  const s = CAT[cat]
  const openIndicator = open ? '▾' : '▸'
  const chevron = hasKids ? openIndicator : '·'

  return (
    <div>
      <div
        className="flex items-center"
        style={{ height: ROW_H, minWidth: 'max-content' }}
      >
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

        {depth > 0 && (
          <div className="shrink-0 relative" style={{ width: GUIDE_W, height: ROW_H }}>
            <div className="absolute" style={{ left: 9, top: 0, height: ROW_H / 2, width: 1, background: '#3f3f46' }} />
            {!isLast && (
              <div className="absolute" style={{ left: 9, top: ROW_H / 2, bottom: 0, width: 1, background: '#3f3f46' }} />
            )}
            <div className="absolute" style={{ left: 10, top: ROW_H / 2 - 0.5, right: 0, height: 1, background: '#3f3f46' }} />
          </div>
        )}

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
          <span style={{ width: 10, fontSize: 9, color: '#71717a', fontFamily: 'monospace', flexShrink: 0 }}>
            {chevron}
          </span>

          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: s.ic, flexShrink: 0, minWidth: 14, textAlign: 'center' }}>
            {s.icon}
          </span>

          <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: s.tc, flexShrink: 0 }}>
            {node.type}
          </span>

          {node.value !== undefined && (
            <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#fcd34d', flexShrink: 0 }}>
              {renderValue(node.value)}
            </span>
          )}

          {hasKids && !open && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', flexShrink: 0 }}>
              ({node.children!.length})
            </span>
          )}
        </button>
      </div>

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
