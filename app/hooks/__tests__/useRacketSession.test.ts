import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRacketSession } from '../useRacketSession'
import type { TraceResult } from '@/app/types/racket'

vi.mock('@/app/services/racket', () => ({ runTrace: vi.fn() }))
import { runTrace } from '@/app/services/racket'

function emptyResult(overrides: Partial<TraceResult> = {}): TraceResult {
  return { stdout: '', stderr: '', error: null, steps: [], ast: null, environments: [], output: null, ...overrides }
}

describe('useRacketSession', () => {
  beforeEach(() => {
    vi.mocked(runTrace).mockReset()
  })

  it('start activates the session and stop deactivates it', () => {
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.start())
    expect(result.current.sessionActive).toBe(true)
    act(() => result.current.stop())
    expect(result.current.sessionActive).toBe(false)
  })

  it('run logs an info message and does nothing when input is empty', async () => {
    const { result } = renderHook(() => useRacketSession())
    await act(async () => result.current.run([]))
    expect(result.current.logs).toHaveLength(1)
    expect(result.current.logs[0].level).toBe('info')
    expect(runTrace).not.toHaveBeenCalled()
  })

  it('run does nothing if already running', async () => {
    vi.mocked(runTrace).mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('(+ 1 1)'))
    act(() => { result.current.run([]) })
    await waitFor(() => expect(result.current.running).toBe(true))
    act(() => { result.current.run([]) })
    expect(runTrace).toHaveBeenCalledOnce()
  })

  it('run logs each stderr line as an error', async () => {
    vi.mocked(runTrace).mockResolvedValue(emptyResult({ stderr: 'line1\nline2' }))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('boom'))
    await act(async () => result.current.run([]))
    const errorLogs = result.current.logs.filter(l => l.level === 'error')
    expect(errorLogs.map(l => l.message)).toEqual(['line1', 'line2'])
  })

  it('run sets ast and frames from the last step when not in step mode', async () => {
    vi.mocked(runTrace).mockResolvedValue(emptyResult({
      steps: [
        { ast: { type: 'number', value: 1 }, output: '1', environments: [] },
        { ast: { type: 'number', value: 2 }, output: '2', environments: [{ label: 'e', frames: [] }] },
      ],
    }))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('(+ 1 1)'))
    await act(async () => result.current.run([]))
    expect(result.current.ast).toEqual({ type: 'number', value: 2 })
    expect(result.current.frames).toEqual([{ label: 'e', frames: [] }])
    expect(result.current.logs.map(l => l.message)).toEqual(['(+ 1 1)', '1', '2'])
  })

  it('run in step mode shows the first step and queues the rest', async () => {
    vi.mocked(runTrace).mockResolvedValue(emptyResult({
      steps: [
        { ast: { type: 'number', value: 1 }, output: '1', environments: [] },
        { ast: { type: 'number', value: 2 }, output: '2', environments: [] },
      ],
    }))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.toggleStepMode())
    act(() => result.current.setTestInput('(+ 1 1)'))
    await act(async () => result.current.run([]))
    expect(result.current.pendingSteps).toBe(1)
    expect(result.current.logs.some(l => l.message === '1')).toBe(true)

    act(() => result.current.nextStep())
    expect(result.current.pendingSteps).toBe(0)
    expect(result.current.logs.some(l => l.message === '2')).toBe(true)
  })

  it('nextStep does nothing when there are no pending steps', () => {
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.nextStep())
    expect(result.current.logs).toEqual([])
  })

  it('run logs a connection error when runTrace rejects', async () => {
    vi.mocked(runTrace).mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('boom'))
    await act(async () => result.current.run([]))
    expect(result.current.logs.some(l => l.level === 'error' && l.message.includes('conectar'))).toBe(true)
  })

  it('run silently swallows AbortError', async () => {
    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    vi.mocked(runTrace).mockRejectedValue(abortErr)
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('boom'))
    await act(async () => result.current.run([]))
    expect(result.current.logs.some(l => l.level === 'error')).toBe(false)
  })

  it('clear resets logs, ast and frames', async () => {
    vi.mocked(runTrace).mockResolvedValue(emptyResult({
      steps: [{ ast: { type: 'number', value: 1 }, output: '1', environments: [{ label: 'e', frames: [] }] }],
    }))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.setTestInput('x'))
    await act(async () => result.current.run([]))
    act(() => result.current.clear())
    expect(result.current.logs).toEqual([])
    expect(result.current.ast).toBeNull()
    expect(result.current.frames).toEqual([])
  })

  it('toggleStepMode flips the flag and clears pending steps', () => {
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.toggleStepMode())
    expect(result.current.stepMode).toBe(true)
    act(() => result.current.toggleStepMode())
    expect(result.current.stepMode).toBe(false)
  })

  it('resetForFileChange clears session state', async () => {
    vi.mocked(runTrace).mockResolvedValue(emptyResult({
      steps: [{ ast: { type: 'number', value: 1 }, output: '1', environments: [] }],
    }))
    const { result } = renderHook(() => useRacketSession())
    act(() => result.current.start())
    act(() => result.current.setTestInput('x'))
    await act(async () => result.current.run([]))
    act(() => result.current.resetForFileChange())
    expect(result.current.sessionActive).toBe(false)
    expect(result.current.testInput).toBe('')
    expect(result.current.ast).toBeNull()
    expect(result.current.logs).toEqual([])
  })
})
