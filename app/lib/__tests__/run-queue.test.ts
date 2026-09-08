import { describe, it, expect, vi } from 'vitest'
import { withRunSlot } from '../run-queue'

describe('withRunSlot', () => {
  it('runs the function and returns its result', async () => {
    const controller = new AbortController()
    const result = await withRunSlot(controller.signal, async () => 42)
    expect(result).toBe(42)
  })

  it('throws AbortError immediately if the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const fn = vi.fn(async () => 'unreachable')
    await expect(withRunSlot(controller.signal, fn)).rejects.toThrow('Aborted')
  })

  it('queues runs beyond the concurrency limit and runs them once a slot frees up', async () => {
    const cpuCount = (await import('node:os')).cpus().length
    const controller = new AbortController()
    const order: number[] = []
    const blockers: Array<() => void> = []

    const makeSlow = (n: number) =>
      withRunSlot(controller.signal, () => {
        order.push(n)
        return new Promise<void>((resolve) => blockers.push(resolve))
      })

    const runs = Array.from({ length: cpuCount + 1 }, (_, i) => makeSlow(i))
    await new Promise((r) => setTimeout(r, 10))

    expect(order).toHaveLength(cpuCount)

    blockers[0]()
    await runs[0]
    await new Promise((r) => setTimeout(r, 10))
    expect(order).toHaveLength(cpuCount + 1)

    blockers.slice(1).forEach((resolve) => resolve())
    await Promise.all(runs)
  })

  it('releases the slot even if the function throws', async () => {
    const controller = new AbortController()
    await expect(
      withRunSlot(controller.signal, async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')

    const result = await withRunSlot(controller.signal, async () => 'after-error')
    expect(result).toBe('after-error')
  })
})
