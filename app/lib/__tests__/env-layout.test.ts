import { describe, it, expect } from 'vitest'
import { cardHeight, CARD_H_HEADER, CARD_H_ROW, CARD_H_SEP, CARD_PAD_V } from '../env-layout'
import type { EnvFrame } from '@/app/types/environment'

function frame(frames: unknown[][]): EnvFrame {
  return { frames } as EnvFrame
}

describe('cardHeight', () => {
  it('computes height for a single empty frame', () => {
    const f = frame([[]])
    expect(cardHeight(f)).toBe(CARD_H_HEADER + CARD_PAD_V * 2)
  })

  it('adds row height per binding', () => {
    const f = frame([[1, 2, 3]])
    expect(cardHeight(f)).toBe(CARD_H_HEADER + CARD_PAD_V * 2 + 3 * CARD_H_ROW)
  })

  it('adds separator height between multiple sub-frames', () => {
    const f = frame([[1], [2]])
    expect(cardHeight(f)).toBe(CARD_H_HEADER + CARD_PAD_V * 2 + 2 * CARD_H_ROW + CARD_H_SEP)
  })

  it('handles no frames at all', () => {
    const f = frame([])
    expect(cardHeight(f)).toBe(CARD_H_HEADER + CARD_PAD_V * 2)
  })
})
