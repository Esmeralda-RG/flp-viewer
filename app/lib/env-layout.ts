import type { EnvFrame, FrameKind } from '@/app/types/environment'

export const CARD_W = 230
export const CARD_H_HEADER = 34
export const CARD_H_ROW = 22
export const CARD_H_SEP = 10
export const CARD_PAD_V = 10
export const CARD_GAP = 72
export const CARD_ROW_GAP = 24
export const CARD_RX = 8

export const VALUE_COLORS: Record<string, string> = {
  number:  '#93c5fd',
  string:  '#86efac',
  boolean: '#fcd34d',
  lambda:  '#c4b5fd',
  list:    '#67e8f9',
  void:    '#71717a',
  struct:  '#f9a8d4',
}

export const FRAME_HEADER_FILL: Record<FrameKind, string> = {
  binding:    '#2d2d30',
  assignment: '#3a2712',
}

export const FRAME_LABEL_COLOR: Record<FrameKind, string> = {
  binding:    '#a1a1aa',
  assignment: '#fbbf24',
}

export function cardHeight(frame: EnvFrame): number {
  const totalBindings = frame.frames.reduce((sum, f) => sum + f.length, 0)
  const separators = Math.max(0, frame.frames.length - 1)
  const body = totalBindings * CARD_H_ROW + separators * CARD_H_SEP
  return CARD_H_HEADER + CARD_PAD_V + body + CARD_PAD_V
}

export interface FramePosition {
  x: number
  y: number
  h: number
  column: number
}

// Cada marco va en la columna de su profundidad real de extensión (empty-env
// es la columna 0), no en la de su posición cronológica: los marcos que de
// verdad extienden al anterior quedan a un lado, y los que comparten el
// mismo padre (llamadas recursivas, ramas distintas de un cierre) se apilan
// uno debajo del otro en la misma columna. Una asignación no extiende nada
// — se coloca una columna a la derecha del marco que mutó, como su eco.
export function computeFrameLayout(frames: EnvFrame[]): FramePosition[] {
  const columns: number[] = []
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]
    if (f.parentFrameIndex !== undefined) columns[i] = columns[f.parentFrameIndex] + 1
    else if (f.targetFrameIndex !== undefined) columns[i] = columns[f.targetFrameIndex] + 1
    else columns[i] = 0
  }

  const columnCursor: number[] = []
  return frames.map((f, i) => {
    const column = columns[i]
    const y = columnCursor[column] ?? 0
    const h = cardHeight(f)
    columnCursor[column] = y + h + CARD_ROW_GAP
    return { x: column * (CARD_W + CARD_GAP), y, h, column }
  })
}
