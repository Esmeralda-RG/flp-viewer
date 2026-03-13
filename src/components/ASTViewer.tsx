import { useEffect, useMemo, useRef, useState } from 'react'
import Tree from 'react-d3-tree'
import type { AstNode } from '@/types'

type ASTViewerProps = {
  ast: AstNode
  visible: boolean
}

type TreeDataNode = {
  name: string
  attributes?: Record<string, string>
  children?: TreeDataNode[]
}

function buildTreeNode(node: AstNode): TreeDataNode {
  return {
    name: node.type,
    attributes: node.value ? { token: node.value } : undefined,
    children: node.children?.map(buildTreeNode),
  }
}

function ASTViewer({ ast, visible }: Readonly<ASTViewerProps>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selectedNode, setSelectedNode] = useState<TreeDataNode | null>(null)

  const treeData = useMemo(() => buildTreeNode(ast), [ast])

  useEffect(() => {
    if (!wrapperRef.current) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(wrapperRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">AST Viewer</h2>
      {visible ? (
        <div className="grid h-full min-h-0 grid-rows-[1fr_8rem] gap-3">
          <div ref={wrapperRef} className="min-h-0 overflow-hidden rounded-lg border border-slate-300 bg-white">
            {dimensions.width > 0 && dimensions.height > 0 ? (
              <Tree
                data={treeData}
                orientation="vertical"
                translate={{ x: dimensions.width / 2, y: 48 }}
                rootNodeClassName="ast-node__root"
                branchNodeClassName="ast-node__branch"
                leafNodeClassName="ast-node__leaf"
                pathClassFunc={() => 'ast-link'}
                pathFunc="step"
                collapsible
                separation={{ siblings: 1.25, nonSiblings: 1.6 }}
                initialDepth={2}
                zoom={0.85}
                onNodeClick={(nodeData) => {
                  setSelectedNode(nodeData.data as TreeDataNode)
                }}
              />
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700">
            {selectedNode ? (
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">Nodo:</span>{' '}
                  <span className="text-cyan-700">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Token:</span>{' '}
                  <span>{selectedNode.attributes?.token ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Hijos:</span> {selectedNode.children?.length ?? 0}
                </div>
              </div>
            ) : (
              <div className="text-slate-500">Haz click en un nodo para ver detalle de token y estructura.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-400">
          AST oculto
        </div>
      )}
    </section>
  )
}

export default ASTViewer