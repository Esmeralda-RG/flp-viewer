'use client'

import { useRef, useEffect, useCallback, useState, type RefObject } from 'react'
import type { Transform } from '@/app/types/environment'

export function usePanZoom(ref: RefObject<HTMLDivElement | null>) {
  const [t, setT] = useState<Transform>({ x: 24, y: 32, k: 1 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setT(prev => {
        const factor = e.deltaY < 0 ? 1.08 : 0.93
        const k = Math.max(0.15, Math.min(3, prev.k * factor))
        return {
          k,
          x: mx - (mx - prev.x) * (k / prev.k),
          y: my - (my - prev.y) * (k / prev.k),
        }
      })
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      last.current = { x: e.clientX, y: e.clientY }
      el.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      setT(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    }

    const onMouseUp = () => {
      dragging.current = false
      el.style.cursor = 'grab'
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    globalThis.addEventListener('mousemove', onMouseMove)
    globalThis.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      globalThis.removeEventListener('mousemove', onMouseMove)
      globalThis.removeEventListener('mouseup', onMouseUp)
    }
  }, [ref])

  const reset = useCallback(() => setT({ x: 24, y: 32, k: 1 }), [])
  return { t, reset }
}
