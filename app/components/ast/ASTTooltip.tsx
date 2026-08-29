'use client'

import { createPortal } from 'react-dom'
import type { ASTTooltipProps } from '@/app/types/props'

const WIDTH = 220
const ESTIMATED_HEIGHT = 90
const MARGIN = 4

export default function ASTTooltip({ anchorRect, category, categoryColor, text }: Readonly<ASTTooltipProps>) {
  const spaceBelow = window.innerHeight - anchorRect.bottom
  const top = spaceBelow < ESTIMATED_HEIGHT + MARGIN
    ? anchorRect.top - ESTIMATED_HEIGHT - MARGIN
    : anchorRect.bottom + MARGIN
  const left = Math.min(anchorRect.left, window.innerWidth - WIDTH - 8)

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 1000,
        width: WIDTH,
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid #3f3f46',
        background: '#18181b',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        fontSize: 11,
        lineHeight: 1.4,
        fontWeight: 400,
        color: '#d4d4d8',
        textAlign: 'left',
        whiteSpace: 'normal',
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: categoryColor, fontWeight: 600 }}>{category}</span> — {text}
    </div>,
    document.body,
  )
}
