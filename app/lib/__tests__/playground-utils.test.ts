import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import JSZip from 'jszip'
import { upsertFile, downloadZip, FILE_EXT_COLORS, INITIAL_FILES } from '../playground-utils'
import type { EditorFile } from '@/app/types/editor'

function makeFile(overrides: Partial<EditorFile> = {}): EditorFile {
  return { id: 'main', revision: 0, name: 'main.rkt', content: '', language: 'scheme', ...overrides }
}

describe('INITIAL_FILES', () => {
  it('includes a main.rkt and a generated utils.rkt', () => {
    expect(INITIAL_FILES.map(f => f.name)).toEqual(['main.rkt', 'utils.rkt'])
    expect(INITIAL_FILES[1].content.length).toBeGreaterThan(0)
  })
})

describe('FILE_EXT_COLORS', () => {
  it('maps known extensions to colors', () => {
    expect(FILE_EXT_COLORS.rkt).toBeTruthy()
    expect(FILE_EXT_COLORS.g).toBeTruthy()
  })
})

describe('upsertFile', () => {
  it('appends a new file when the id does not exist', () => {
    const result = upsertFile([], 'main', 'main.rkt', 'code', 'scheme')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 'main', revision: 0, name: 'main.rkt', content: 'code', language: 'scheme', lockedLines: undefined })
  })

  it('updates and bumps revision when the id already exists', () => {
    const prev = [makeFile({ revision: 2, content: 'old' })]
    const result = upsertFile(prev, 'main', 'main.rkt', 'new', 'scheme')
    expect(result[0].revision).toBe(3)
    expect(result[0].content).toBe('new')
  })

  it('does not mutate the previous array', () => {
    const prev = [makeFile()]
    upsertFile(prev, 'main', 'main.rkt', 'new', 'scheme')
    expect(prev[0].content).toBe('')
  })

  it('preserves other files when updating one', () => {
    const prev = [makeFile({ id: 'a' }), makeFile({ id: 'b' })]
    const result = upsertFile(prev, 'a', 'a.rkt', 'updated', 'scheme')
    expect(result).toHaveLength(2)
    expect(result.find(f => f.id === 'b')?.content).toBe('')
  })

  it('passes through lockedLines', () => {
    const result = upsertFile([], 'main', 'main.rkt', 'code', 'scheme', [1, 2])
    expect(result[0].lockedLines).toEqual([1, 2])
  })
})

describe('downloadZip', () => {
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates an anchor, triggers a click, and revokes the object URL', async () => {
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    const files = [makeFile({ content: 'hola' })]
    await downloadZip(files, 'test.zip')

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('uncomments the (interpreter) line only in main.rkt before zipping', async () => {
    const files = [
      makeFile({ id: 'main', name: 'main.rkt', content: '; (interpreter)\n(other)' }),
      makeFile({ id: 'utils', name: 'utils.rkt', content: '; (interpreter)' }),
    ]
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') el.click = vi.fn()
      return el
    })

    let blob: Blob | undefined
    ;(URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation((b: Blob) => {
      blob = b
      return 'blob:mock'
    })

    await downloadZip(files)

    const zip = await JSZip.loadAsync(blob!)
    expect(await zip.file('main.rkt')!.async('string')).toBe('(interpreter)\n(other)')
    expect(await zip.file('utils.rkt')!.async('string')).toBe('; (interpreter)')
  })
})
