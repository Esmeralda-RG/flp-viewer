import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type React from 'react'
import { useInputHistory } from '../useInputHistory'

function keyEvent(value: string, cursor: number = value.length) {
  const preventDefault = vi.fn()
  const event = {
    currentTarget: { value, selectionStart: cursor },
    preventDefault,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>
  return { event, preventDefault }
}

function setup(value = '') {
  const onChange = vi.fn()
  const hook = renderHook(({ v }) => useInputHistory(v, onChange), { initialProps: { v: value } })
  return { ...hook, onChange }
}

describe('useInputHistory', () => {
  it('ArrowUp does nothing when history is empty', () => {
    const { result, onChange } = setup()
    const { event, preventDefault } = keyEvent('')
    act(() => result.current.onArrowUp(event))
    expect(onChange).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('ArrowDown does nothing when not navigating', () => {
    const { result, onChange } = setup()
    const { event } = keyEvent('')
    act(() => result.current.onArrowDown(event))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ArrowUp recalls the last recorded entry', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    const { event, preventDefault } = keyEvent('')
    act(() => result.current.onArrowUp(event))
    expect(onChange).toHaveBeenCalledWith('uno')
    expect(preventDefault).toHaveBeenCalled()
  })

  it('does not record consecutive duplicates', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    act(() => result.current.record('uno'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    act(() => result.current.onArrowUp(keyEvent('uno').event))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('ArrowUp twice walks back to the first entry and stops there', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('primero'))
    act(() => result.current.record('segundo'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    act(() => result.current.onArrowUp(keyEvent('segundo').event))
    act(() => result.current.onArrowUp(keyEvent('primero').event))
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(['segundo', 'primero'])
  })

  it('ArrowDown moves forward through history', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    act(() => result.current.record('dos'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    act(() => result.current.onArrowUp(keyEvent('dos').event))
    act(() => result.current.onArrowDown(keyEvent('uno').event))
    expect(onChange).toHaveBeenLastCalledWith('dos')
  })

  it('ArrowDown past the newest entry restores the draft', () => {
    const { result, onChange, rerender } = setup()
    act(() => result.current.record('guardado'))
    rerender({ v: 'borrador' })
    act(() => result.current.onArrowUp(keyEvent('borrador').event))
    act(() => result.current.onArrowDown(keyEvent('guardado').event))
    expect(onChange).toHaveBeenLastCalledWith('borrador')
  })

  it('ArrowUp ignores multi-line input when the cursor is past the first line', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    const { event, preventDefault } = keyEvent('a\nb', 3)
    act(() => result.current.onArrowUp(event))
    expect(onChange).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('ArrowDown ignores multi-line input when the cursor is before the last line', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    onChange.mockClear()
    const { event, preventDefault } = keyEvent('a\nb', 0)
    act(() => result.current.onArrowDown(event))
    expect(onChange).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('record resets navigation so ArrowUp starts from the newest entry', () => {
    const { result, onChange } = setup()
    act(() => result.current.record('uno'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    act(() => result.current.record('dos'))
    act(() => result.current.onArrowUp(keyEvent('').event))
    expect(onChange).toHaveBeenLastCalledWith('dos')
  })
})
