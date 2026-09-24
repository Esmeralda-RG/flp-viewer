'use client'

import { useRef } from 'react'
import type { EnvironmentPanelProps } from '@/app/types/props'
import { computeFrameLayout, CARD_W, CARD_GAP } from '@/app/lib/env-layout'
import { usePanZoom } from '@/app/hooks/usePanZoom'
import FrameCard from './FrameCard'
import Arrow from './Arrow'
import EnvHeader from './EnvHeader'

export default function EnvironmentPanel({ frames, onEditInitEnv }: Readonly<EnvironmentPanelProps>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t, reset } = usePanZoom(containerRef)

  const positions = computeFrameLayout(frames)
  const maxColumn = positions.length > 0 ? Math.max(...positions.map((p) => p.column)) : 0
  const svgW = frames.length > 0 ? (maxColumn + 1) * (CARD_W + CARD_GAP) + 40 : 0
  const svgH = frames.length > 0 ? Math.max(...positions.map((p) => p.y + p.h)) + 40 : 0

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <EnvHeader count={frames.length} onReset={reset} onEditInitEnv={onEditInitEnv} />

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
                <marker id="arrowhead-target" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
                </marker>
              </defs>

              {frames.map((frame, i) => {
                // El padre real (el ambiente que extend-env recibió) queda
                // siempre exactamente una columna a la izquierda gracias al
                // layout por profundidad — no hace falta un arco que salte
                // marcos de en medio, una flecha recta alcanza.
                if (frame.parentFrameIndex === undefined) return null
                const from = positions[frame.parentFrameIndex]
                const to = positions[i]
                return (
                  <Arrow
                    key={`extends-${i}-${frame.parentFrameIndex}`}
                    testId="extends-arrow"
                    dataFrom={frame.parentFrameIndex}
                    dataTo={i}
                    x1={from.x + CARD_W + 3} y1={from.y + from.h / 2}
                    x2={to.x - 3}            y2={to.y + to.h / 2}
                  />
                )
              })}

              {frames.map((frame, i) => {
                // Una asignación no extiende nada: se coloca una columna a
                // la derecha del marco que mutó, así que esta flecha va
                // "hacia atrás" (de derecha a izquierda) para señalarlo.
                if (frame.targetFrameIndex === undefined) return null
                const from = positions[i]
                const to = positions[frame.targetFrameIndex]
                return (
                  <Arrow
                    key={`target-${i}-${frame.targetFrameIndex}`}
                    testId="assign-target-arrow"
                    dataFrom={i}
                    dataTo={frame.targetFrameIndex}
                    color="#fbbf24"
                    dashed
                    markerId="arrowhead-target"
                    x1={from.x - 3}        y1={from.y + from.h / 2}
                    x2={to.x + CARD_W + 3} y2={to.y + to.h / 2}
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
