'use client'

import { useState, useEffect } from 'react'
import type { ASTViewerProps } from '@/app/types/props'
import type { ExpandMode } from '@/app/types/ast'
import { normalize } from '@/app/lib/ast-view'
import TreeNode from './TreeNode'

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
            <p className="text-xs text-zinc-400">Ejecuta el código para ver el AST</p>
          </div>
        )}
      </div>
    </div>
  )
}
