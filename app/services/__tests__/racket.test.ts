import { describe, it, expect, vi, afterEach } from 'vitest'
import { runTrace, valueToString } from '../racket'

function mockFetchOnce(response: Partial<Response> & { jsonBody?: unknown }) {
  const { jsonBody, ...rest } = response
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => jsonBody,
    ...rest,
  }))
}

describe('valueToString', () => {
  it('renders null/undefined as null', () => {
    expect(valueToString(null)).toBe('null')
    expect(valueToString(undefined)).toBe('null')
  })

  it('renders primitives', () => {
    expect(valueToString(true)).toBe('true')
    expect(valueToString(42)).toBe('42')
    expect(valueToString('hi')).toBe('"hi"')
  })

  it('renders empty and non-empty arrays', () => {
    expect(valueToString([])).toBe('[]')
    expect(valueToString([1, 'a'])).toBe('[1, "a"]')
  })

  it('renders tagged objects using their type', () => {
    expect(valueToString({ type: 'procedure' })).toBe('<procedure>')
  })

  it('falls back to JSON.stringify for untyped objects', () => {
    expect(valueToString({ foo: 1 })).toBe('{"foo":1}')
  })

  it('renders symbols, bigints and functions via toString', () => {
    expect(valueToString(Symbol('s'))).toBe('Symbol(s)')
    expect(valueToString(BigInt(10))).toBe('10')
    expect(valueToString(() => {})).toContain('=>')
  })
})

describe('runTrace', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts files and testInput to /api/run', async () => {
    mockFetchOnce({ jsonBody: { stdout: '', stderr: '', error: null, steps: null } })
    await runTrace([{ name: 'main.rkt', content: 'x' }], '(+ 1 1)')
    expect(fetch).toHaveBeenCalledWith('/api/run', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ files: [{ name: 'main.rkt', content: 'x' }], testInput: '(+ 1 1)' }),
    }))
  })

  it('returns an error result when the response is not ok', async () => {
    mockFetchOnce({ ok: false, status: 500, statusText: 'Internal Error', jsonBody: {} })
    const result = await runTrace([], 'x')
    expect(result.stderr).toBe('HTTP 500: Internal Error')
    expect(result.error).toBe('Internal Error')
    expect(result.steps).toEqual([])
  })

  it('parses steps and derives ast/environments/output from the last step', async () => {
    mockFetchOnce({
      jsonBody: {
        stdout: '', stderr: '', error: null,
        steps: [
          { ast: 1, output: 'first', environments: [] },
          {
            ast: { type: 'call-exp', fields: [true, 'x'] },
            output: 42,
            environments: [
              { tag: 'empty-env', frames: [] },
              { tag: 'init-env', frames: [[{ name: 'x', value: 1 }]] },
              { tag: 'other', frames: [[{ name: 'y', value: [1, 2] }]] },
              { tag: 'assign', frames: [[{ name: 'x', value: 9 }]] },
            ],
          },
        ],
      },
    })
    const result = await runTrace([], 'x')
    expect(result.ast).toEqual({ type: 'call-exp', children: [{ type: 'boolean', value: true }, { type: 'string', value: 'x' }] })
    expect(result.output).toBe('42')
    expect(result.environments).toEqual([
      { label: 'empty-env', kind: 'binding', frames: [] },
      { label: 'init-env', kind: 'binding', frames: [[{ name: 'x', value: '1', type: 'number' }]] },
      { label: 'extend', kind: 'binding', frames: [[{ name: 'y', value: '[1, 2]', type: 'list' }]] },
      { label: 'asignación', kind: 'assignment', frames: [[{ name: 'x', value: '9', type: 'number' }]] },
    ])
  })

  it('handles a null/empty steps array gracefully', async () => {
    mockFetchOnce({ jsonBody: { stdout: 'out', stderr: 'err', error: 'boom', steps: null } })
    const result = await runTrace([], 'x')
    expect(result.stdout).toBe('out')
    expect(result.stderr).toBe('err')
    expect(result.error).toBe('boom')
    expect(result.steps).toEqual([])
    expect(result.ast).toBeNull()
    expect(result.output).toBeNull()
  })

  it('converts a top-level array ast node, empty or not, into a list node', async () => {
    mockFetchOnce({
      jsonBody: {
        stdout: '', stderr: '', error: null,
        steps: [
          { ast: [], output: null, environments: [] },
          { ast: [1, 2], output: null, environments: [] },
        ],
      },
    })
    const result = await runTrace([], 'x')
    expect(result.steps[0].ast).toEqual({ type: 'list' })
    expect(result.steps[1].ast).toEqual({
      type: 'list',
      children: [{ type: 'number', value: 1 }, { type: 'number', value: 2 }],
    })
  })

  it('falls back to a JSON string type for objects without a string "type" field', async () => {
    mockFetchOnce({
      jsonBody: {
        stdout: '', stderr: '', error: null,
        steps: [{ ast: { foo: 'bar' }, output: null, environments: [] }],
      },
    })
    const result = await runTrace([], 'x')
    expect(result.ast).toEqual({ type: '{"foo":"bar"}' })
  })

  it('leaves children undefined when a typed ast node has no fields', async () => {
    mockFetchOnce({
      jsonBody: {
        stdout: '', stderr: '', error: null,
        steps: [{ ast: { type: 'lit-exp' }, output: null, environments: [] }],
      },
    })
    const result = await runTrace([], 'x')
    expect(result.ast).toEqual({ type: 'lit-exp' })
  })

  it('derives lambda, void, struct and unknown binding types from env frames', async () => {
    mockFetchOnce({
      jsonBody: {
        stdout: '', stderr: '', error: null,
        steps: [{
          ast: null,
          output: null,
          environments: [{
            tag: 'extend',
            frames: [[
              { name: 'proc', value: { type: 'procedure' } },
              { name: 'vd', value: { type: 'void' } },
              { name: 's', value: { type: 'point', fields: [1, 2] } },
              { name: 'flag', value: true },
              { name: 'nothing', value: null },
            ]],
          }],
        }],
      },
    })
    const result = await runTrace([], 'x')
    expect(result.environments[0].frames[0]).toEqual([
      { name: 'proc', value: '<procedure>', type: 'lambda' },
      { name: 'vd', value: '<void>', type: 'void' },
      { name: 's', value: '<point 1 2>', type: 'struct' },
      { name: 'flag', value: 'true', type: 'boolean' },
      { name: 'nothing', value: 'null', type: 'unknown' },
    ])
  })

  it('propagates the abort signal to fetch', async () => {
    mockFetchOnce({ jsonBody: { stdout: '', stderr: '', error: null, steps: null } })
    const controller = new AbortController()
    await runTrace([], 'x', controller.signal)
    expect(fetch).toHaveBeenCalledWith('/api/run', expect.objectContaining({ signal: controller.signal }))
  })
})
