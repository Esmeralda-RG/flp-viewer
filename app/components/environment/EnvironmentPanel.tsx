'use client'

import { useRef } from 'react'
import type { EnvironmentPanelProps } from '@/app/types/props'
import { cardHeight, CARD_W, CARD_GAP } from '@/app/lib/env-layout'
import { usePanZoom } from '@/app/hooks/usePanZoom'
import FrameCard from './FrameCard'
import Arrow from './Arrow'
import EnvHeader from './EnvHeader'

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
