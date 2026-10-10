'use client'

import { useEffect } from 'react'
import type { ExpandablePanelProps } from '@/app/types/props'

// Se mantiene el mismo árbol de React y solo cambia la clase, para no perder
// el estado interno del panel (zoom/pan del ambiente, nodos abiertos del AST).
export default function ExpandablePanel({ expanded, onCollapse, children }: Readonly<ExpandablePanelProps>) {
  useEffect(() => {
    if (!expanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCollapse()
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [expanded, onCollapse])

  return <div className={expanded ? 'fixed inset-0 z-40 bg-[#1e1e1e]' : 'h-full'}>{children}</div>
}
