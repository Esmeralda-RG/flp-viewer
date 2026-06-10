'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

import type { Binding, EnvFrame } from '@/app/types/environment'
export type { Binding, EnvFrame }

const CARD_W = 230
const CARD_H_HEADER = 34
const CARD_H_ROW = 22
const CARD_H_SEP = 10
const CARD_PAD_V = 10
const CARD_GAP = 72
const CARD_RX = 8

const VALUE_COLORS: Record<string, string> = {
  number:  '#93c5fd',
  string:  '#86efac',
  boolean: '#fcd34d',
  lambda:  '#c4b5fd',
  list:    '#67e8f9',
  void:    '#71717a',
  struct:  '#f9a8d4',
}

function cardHeight(frame: EnvFrame): number {
  const totalBindings = frame.frames.reduce((sum, f) => sum + f.length, 0)
  const separators = Math.max(0, frame.frames.length - 1)
  const body = totalBindings * CARD_H_ROW + separators * CARD_H_SEP
  return CARD_H_HEADER + CARD_PAD_V + body + CARD_PAD_V
}

interface Transform { x: number; y: number; k: number }

function usePanZoom(ref: React.RefObject<HTMLDivElement | null>) {
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

function FrameCard({ frame, x, y }: Readonly<{ frame: EnvFrame; x: number; y: number }>) {
  const h = cardHeight(frame)
  let cursor = CARD_H_HEADER + CARD_PAD_V

  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={3} y={4} width={CARD_W} height={h} rx={CARD_RX} fill="rgba(0,0,0,0.35)" />
      <rect width={CARD_W} height={h} rx={CARD_RX} fill="#252526" stroke="#3c3c3c" strokeWidth={1} />
      <rect width={CARD_W} height={CARD_H_HEADER} rx={CARD_RX} fill="#2d2d30" />
      <rect y={CARD_H_HEADER - CARD_RX} width={CARD_W} height={CARD_RX} fill="#2d2d30" />
      <text
        x={CARD_W / 2} y={CARD_H_HEADER / 2 + 5}
        textAnchor="middle" fill="#a1a1aa"
        fontSize={11} fontFamily="ui-monospace,monospace" fontWeight={600}
      >
        {frame.label}
      </text>

      {frame.frames.map((scope, si) => {
        const sepY = cursor

        if (si > 0) cursor += CARD_H_SEP

        const rows = scope.map((b) => {
          const rowY = cursor
          cursor += CARD_H_ROW
          const color = VALUE_COLORS[b.type] ?? '#d4d4d8'
          const val = b.value.length > 18 ? b.value.slice(0, 16) + '…' : b.value
          return (
            <g key={`${si}-${b.name}`}>
              <text x={14} y={rowY + 15} fill="#e4e4e7" fontSize={11} fontFamily="ui-monospace,monospace">{b.name}</text>
              <text x={CARD_W / 2 - 6} y={rowY + 15} fill="#4b5563" fontSize={11} fontFamily="ui-monospace,monospace">=</text>
              <text x={CARD_W / 2 + 2} y={rowY + 15} fill={color} fontSize={11} fontFamily="ui-monospace,monospace">{val}</text>
              <text x={CARD_W - 10} y={rowY + 15} textAnchor="end" fill="#3f3f46" fontSize={9} fontFamily="ui-monospace,monospace">{b.type}</text>
            </g>
          )
        })

        return (
          <g key={si}>
            {si > 0 && (
              <line
                x1={14} y1={sepY + 5}
                x2={CARD_W - 14} y2={sepY + 5}
                stroke="#3c3c3c" strokeWidth={1} strokeDasharray="4 3"
              />
            )}
            {rows}
          </g>
        )
      })}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2 }: Readonly<{ x1: number; y1: number; x2: number; y2: number }>) {
  const cx = (x1 + x2) / 2
  return (
    <path
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      fill="none" stroke="#4b5563" strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  )
}


interface EnvironmentPanelProps {
  frames: EnvFrame[]
  onEditInitEnv?: () => void
}

export default function EnvironmentPanel({ frames, onEditInitEnv }: Readonly<EnvironmentPanelProps>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t, reset } = usePanZoom(containerRef)

  const positions = frames.map((frame, i) => ({
    x: i * (CARD_W + CARD_GAP),
    y: 0,
    h: cardHeight(frame),
  }))

  const svgW = frames.length > 0 ? positions.at(-1)!.x + CARD_W + 40 : 0
  const svgH = frames.length > 0 ? Math.max(...positions.map(p => p.h)) + 40 : 0

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <Header count={frames.length} onReset={reset} onEditInitEnv={onEditInitEnv} />

       
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden select-none"
        style={{ cursor: 'grab' }}
      >
        {frames.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-400">Sin ambientes activos</p>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${t.x}px,${t.y}px) scale(${t.k})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            <svg width={svgW} height={svgH} overflow="visible">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#4b5563" />
                </marker>
              </defs>

              {positions.slice(0, -1).map((pos, i) => {
                const next = positions[i + 1]
                return (
                  <Arrow
                    key={`${pos.x}-${pos.y}-${next.x}-${next.y}`}
                    x1={pos.x + CARD_W + 3} y1={pos.y + pos.h / 2}
                    x2={next.x - 3}         y2={next.y + next.h / 2}
                  />
                )
              })}

              {frames.map((frame, i) => (
                <FrameCard key={`${i}-${frame.label}`} frame={frame} x={positions[i].x} y={positions[i].y} />
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ count, onReset, onEditInitEnv }: Readonly<{
  count: number
  onReset: () => void
  onEditInitEnv?: () => void
}>) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Ambiente</span>
      {onEditInitEnv && (
        <button
          type="button"
          onClick={onEditInitEnv}
          className="text-[10px] px-1.5 py-0.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Editar ambiente inicial"
        >
          editar init-env
        </button>
      )}
      <div className="flex-1" />
      {count > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">{count} snapshot{count === 1 ? '' : 's'}</span>
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] px-1.5 py-0.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            reset vista
          </button>
        </div>
      )}
    </div>
  )
}
