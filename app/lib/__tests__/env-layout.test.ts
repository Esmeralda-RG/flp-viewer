import { describe, it, expect } from 'vitest'
import { cardHeight, computeFrameLayout, CARD_H_HEADER, CARD_H_ROW, CARD_H_SEP, CARD_PAD_V, CARD_W, CARD_GAP } from '../env-layout'
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

describe('computeFrameLayout', () => {
  function envFrame(overrides: Partial<EnvFrame> = {}): EnvFrame {
    return { label: 'extend', frames: [[]], ...overrides }
  }

  it('puts each frame one column to the right of its real parent', () => {
    const frames = [
      envFrame({ label: 'empty-env' }),
      envFrame({ parentFrameIndex: 0 }),
      envFrame({ parentFrameIndex: 1 }),
    ]
    const positions = computeFrameLayout(frames)
    expect(positions.map((p) => p.column)).toEqual([0, 1, 2])
    expect(positions[1].x - positions[0].x).toBe(CARD_W + CARD_GAP)
  })

  it('stacks siblings that share the same parent in one column instead of spreading them out', () => {
    // Alcance estático: f y z comparten el ambiente de creación de f (índice 1);
    // x=100 es hijo de f, no de z.
    const frames = [
      envFrame({ label: 'empty-env' }),
      envFrame({ parentFrameIndex: 0 }),
      envFrame({ parentFrameIndex: 1 }), // f
      envFrame({ parentFrameIndex: 2 }), // x=100, hijo de f
      envFrame({ parentFrameIndex: 1 }), // z, hermano de f
    ]
    const positions = computeFrameLayout(frames)
    expect(positions[2].column).toBe(positions[4].column)
    expect(positions[2].y).not.toBe(positions[4].y)
    expect(positions[3].column).toBe(positions[2].column + 1)
  })

  it('places recursive calls that share the same closure frame all in one column', () => {
    const frames = [
      envFrame({ label: 'empty-env' }),
      envFrame({ parentFrameIndex: 0 }), // fact closure
      envFrame({ parentFrameIndex: 1 }),
      envFrame({ parentFrameIndex: 1 }),
      envFrame({ parentFrameIndex: 1 }),
    ]
    const positions = computeFrameLayout(frames)
    expect(positions.slice(2).map((p) => p.column)).toEqual([2, 2, 2])
    const ys = positions.slice(2).map((p) => p.y)
    expect(new Set(ys).size).toBe(3)
  })

  it('places an assignment one column to the right of the frame it mutated', () => {
    const frames = [
      envFrame({ label: 'empty-env' }),
      envFrame({ parentFrameIndex: 0 }),
      envFrame({ label: 'asignación', kind: 'assignment', targetFrameIndex: 1 }),
    ]
    const positions = computeFrameLayout(frames)
    expect(positions[2].column).toBe(positions[1].column + 1)
  })

  it('treats a frame with neither parent nor target as a root', () => {
    const positions = computeFrameLayout([envFrame()])
    expect(positions[0].column).toBe(0)
  })
})
