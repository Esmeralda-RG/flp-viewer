import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promisify } from 'node:util'

const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }))
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  const mocked = Object.assign(execFileMock, { [promisify.custom]: vi.fn() })
  return { ...actual, execFile: mocked, default: { ...actual, execFile: mocked } }
})

import { execFile } from 'node:child_process'
import { POST } from '../route'

function execFileCustom() {
  return (execFile as unknown as { [key: symbol]: (...a: unknown[]) => unknown })[promisify.custom]
}

function mockSuccess(stdout: string, stderr = '') {
  vi.mocked(execFileCustom()).mockResolvedValue({ stdout, stderr })
}

function mockFailure(err: Record<string, unknown>) {
  vi.mocked(execFileCustom()).mockRejectedValue(err)
}

function makeRequest(body: unknown, signal = new AbortController().signal) {
  return { json: async () => body, signal } as unknown as Request
}

describe('POST /api/run', () => {
  beforeEach(() => {
    vi.mocked(execFileCustom()).mockReset()
  })

  it('returns an error when no files are provided', async () => {
    const res = await POST(makeRequest({ files: [], testInput: 'x' }))
    const data = await res.json()
    expect(data.error).toBe('No files')
    expect(execFileCustom()).not.toHaveBeenCalled()
  })

  it('rejects unsafe file names', async () => {
    const res = await POST(makeRequest({ files: [{ name: '../evil.rkt', content: 'x' }], testInput: 'x' }))
    const data = await res.json()
    expect(data.error).toBe('Invalid file name')
    expect(data.stderr).toContain('../evil.rkt')
  })

  it('runs racket and returns plain stdout when it is not JSON', async () => {
    mockSuccess('resultado en texto', '')
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: '(display 1)' }], testInput: '(+ 1 1)' }))
    const data = await res.json()
    expect(data.stdout).toBe('resultado en texto')
    expect(data.steps).toBeNull()
    expect(data.error).toBeNull()
  })

  it('parses JSON array stdout into steps and empties stdout', async () => {
    mockSuccess(JSON.stringify([{ ast: 1, output: '1', environments: [] }]), '')
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: 'x' }))
    const data = await res.json()
    expect(data.stdout).toBe('')
    expect(data.steps).toEqual([{ ast: 1, output: '1', environments: [] }])
  })

  it('cleans context/location noise from stderr', async () => {
    mockSuccess('', 'real error\n  context...: foo\n  more noise')
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: 'x' }))
    const data = await res.json()
    expect(data.stderr).toBe('real error')
  })

  it('defaults testInput to void when blank', async () => {
    mockSuccess('ok', '')
    await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: '   ' }))
    const args = vi.mocked(execFileCustom()).mock.calls[0]
    expect(args[1]).toContain('void')
  })

  it('injects the tracking block into environment.rkt and stream parser into main.rkt', async () => {
    mockSuccess('ok', '')
    await POST(makeRequest({
      files: [
        { name: 'environment.rkt', content: '(define x 1)' },
        { name: 'main.rkt', content: '(display 1)' },
        { name: 'utils.rkt', content: '(define y 2)' },
      ],
      testInput: 'x',
    }))
    expect(execFileCustom()).toHaveBeenCalled()
  })

  it('reports a timeout error when the process is killed', async () => {
    mockFailure({ killed: true, stderr: '', stdout: '' })
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: 'x' }))
    const data = await res.json()
    expect(data.error).toContain('Tiempo de ejecución agotado')
  })

  it('reports the underlying error message on failure', async () => {
    mockFailure({ message: 'racket: command not found', stderr: '', stdout: '' })
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: 'x' }))
    const data = await res.json()
    expect(data.error).toBe('racket: command not found')
  })

  it('returns HTTP 499 when the request was aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    mockFailure({ message: 'aborted' })
    const res = await POST(makeRequest({ files: [{ name: 'main.rkt', content: 'x' }], testInput: 'x' }, controller.signal))
    expect(res.status).toBe(499)
  })
})
