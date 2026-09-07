import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConsoleLog } from '../useConsoleLog'

describe('useConsoleLog', () => {
  it('starts with no logs', () => {
    const { result } = renderHook(() => useConsoleLog())
    expect(result.current.logs).toEqual([])
  })

  it('appends a log entry with a default level of output', () => {
    const { result } = renderHook(() => useConsoleLog())
    act(() => result.current.addLog('hola'))
    expect(result.current.logs).toHaveLength(1)
    expect(result.current.logs[0].message).toBe('hola')
    expect(result.current.logs[0].level).toBe('output')
  })

  it('appends a log entry with a custom level', () => {
    const { result } = renderHook(() => useConsoleLog())
    act(() => result.current.addLog('boom', 'error'))
    expect(result.current.logs[0].level).toBe('error')
  })

  it('accumulates multiple logs in order', () => {
    const { result } = renderHook(() => useConsoleLog())
    act(() => {
      result.current.addLog('uno')
      result.current.addLog('dos')
    })
    expect(result.current.logs.map(l => l.message)).toEqual(['uno', 'dos'])
  })

  it('assigns unique ids to each log', () => {
    const { result } = renderHook(() => useConsoleLog())
    act(() => {
      result.current.addLog('uno')
      result.current.addLog('dos')
    })
    const [a, b] = result.current.logs
    expect(a.id).not.toBe(b.id)
  })

  it('clearLog empties the logs', () => {
    const { result } = renderHook(() => useConsoleLog())
    act(() => result.current.addLog('hola'))
    act(() => result.current.clearLog())
    expect(result.current.logs).toEqual([])
  })
})
