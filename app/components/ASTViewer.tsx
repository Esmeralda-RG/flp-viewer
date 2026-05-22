'use client'

import { useState } from 'react'

export interface ASTNode {
  type: string
  value?: string | number | boolean
  children?: ASTNode[]
}

interface ASTNodeViewProps {
  node: ASTNode
  depth?: number
}

function ASTNodeView({ node, depth = 0 }: Readonly<ASTNodeViewProps>) {
  const [collapsed, setCollapsed] = useState(depth > 2)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="font-mono text-xs leading-relaxed" style={{ paddingLeft: depth * 16 }}>
      <button
        type="button"
        className="flex w-full items-center gap-1 group cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 text-left"
        onClick={() => hasChildren && setCollapsed(!collapsed)}
        disabled={!hasChildren}
        aria-expanded={hasChildren ? !collapsed : undefined}
      >
        {hasChildren && (
          <span className="text-zinc-500 w-3 text-center select-none">
            {collapsed ? '▶' : '▼'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="text-blue-400">{node.type}</span>
        {node.value !== undefined && (
          <span className="text-amber-300 ml-1">
            {typeof node.value === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        )}
      </button>
      {hasChildren && !collapsed && (
        <div>
          {node.children!.map((child, i) => (
            <ASTNodeView key={`node-${i}-${child.type}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ASTViewerProps {
  ast: ASTNode | null
}

export default function ASTViewer({ ast }: Readonly<ASTViewerProps>) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">AST</span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {ast ? (
          <ASTNodeView node={ast} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-600">Ejecuta el código para ver el AST</p>
          </div>
        )}
      </div>
    </div>
  )
}
