import type { EnvFrame } from '@/app/types/environment'

export const CARD_W = 230
export const CARD_H_HEADER = 34
export const CARD_H_ROW = 22
export const CARD_H_SEP = 10
export const CARD_PAD_V = 10
export const CARD_GAP = 72
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

export function cardHeight(frame: EnvFrame): number {
  const totalBindings = frame.frames.reduce((sum, f) => sum + f.length, 0)
  const separators = Math.max(0, frame.frames.length - 1)
  const body = totalBindings * CARD_H_ROW + separators * CARD_H_SEP
  return CARD_H_HEADER + CARD_PAD_V + body + CARD_PAD_V
}
