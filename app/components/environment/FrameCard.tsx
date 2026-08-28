import type { FrameCardProps } from '@/app/types/props'
import { cardHeight, VALUE_COLORS, CARD_W, CARD_H_HEADER, CARD_H_ROW, CARD_H_SEP, CARD_PAD_V, CARD_RX } from '@/app/lib/env-layout'

export default function FrameCard({ frame, x, y }: Readonly<FrameCardProps>) {
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
