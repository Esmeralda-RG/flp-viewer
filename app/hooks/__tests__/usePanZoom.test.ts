import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanZoom } from '../usePanZoom'

function makeRef(el: HTMLDivElement | null) {
  return { current: el }
}

describe('usePanZoom', () => {
  it('starts with a default transform', () => {
    const div = document.createElement('div')
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    expect(result.current.t).toEqual({ x: 24, y: 32, k: 1 })
  })

  it('does nothing when the ref has no element', () => {
    const { result } = renderHook(() => usePanZoom(makeRef(null)))
    expect(result.current.t).toEqual({ x: 24, y: 32, k: 1 })
  })

  it('zooms in on wheel with negative deltaY', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON() {},
    })
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    act(() => {
      div.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, clientX: 50, clientY: 50 }))
    })
    expect(result.current.t.k).toBeCloseTo(1.08)
  })

  it('zooms out on wheel with positive deltaY', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON() {},
    })
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    act(() => {
      div.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, clientX: 50, clientY: 50 }))
    })
    expect(result.current.t.k).toBeCloseTo(0.93)
  })

  it('clamps zoom to a minimum of 0.15', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON() {},
    })
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    act(() => {
      for (let i = 0; i < 100; i++) {
        div.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, clientX: 50, clientY: 50 }))
      }
    })
    expect(result.current.t.k).toBeGreaterThanOrEqual(0.15)
  })

  it('pans on mousedown + mousemove, and stops on mouseup', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const { result } = renderHook(() => usePanZoom(makeRef(div)))

    act(() => {
      div.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }))
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 25 }))
    })
    expect(result.current.t.x).toBe(24 + 10)
    expect(result.current.t.y).toBe(32 + 15)

    act(() => {
      globalThis.dispatchEvent(new MouseEvent('mouseup'))
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 999 }))
    })
    expect(result.current.t.x).toBe(24 + 10)
  })

  it('ignores non-primary mouse buttons for dragging', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    act(() => {
      div.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: 10, clientY: 10 }))
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
    })
    expect(result.current.t).toEqual({ x: 24, y: 32, k: 1 })
  })

  it('reset restores the default transform', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const { result } = renderHook(() => usePanZoom(makeRef(div)))
    act(() => {
      div.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10 }))
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
    })
    act(() => result.current.reset())
    expect(result.current.t).toEqual({ x: 24, y: 32, k: 1 })
  })

  it('cleans up listeners on unmount', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const removeSpy = vi.spyOn(div, 'removeEventListener')
    const { unmount } = renderHook(() => usePanZoom(makeRef(div)))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('wheel', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
  })
})
