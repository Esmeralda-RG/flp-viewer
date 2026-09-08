import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectFiles } from '../useProjectFiles'
import type { Example } from '@/app/types/examples'

vi.mock('@/app/lib/playground-utils', async () => {
  const actual = await vi.importActual<typeof import('@/app/lib/playground-utils')>('@/app/lib/playground-utils')
  return { ...actual, downloadZip: vi.fn() }
})

import { downloadZip } from '@/app/lib/playground-utils'

const holaMundo: Example = {
  id: 'hola-mundo',
  label: 'Hola Mundo',
  description: 'demo',
  code: '(display 1)',
  activeFileId: 'main',
  files: [
    { id: 'main', name: 'main.rkt', content: '(display 1)', language: 'scheme' },
    { id: 'utils', name: 'utils.rkt', content: '(define x 1)', language: 'scheme' },
  ],
}

const otherExample: Example = {
  id: 'other',
  label: 'Other',
  description: 'demo2',
  code: '(display 2)',
  lockedLines: [1],
}

describe('useProjectFiles', () => {
  it('initializes files from the hola-mundo example when present', () => {
    const { result } = renderHook(() => useProjectFiles([holaMundo]))
    expect(result.current.files.map(f => f.id)).toEqual(['main', 'utils'])
    expect(result.current.activeFileId).toBe('main')
    expect(result.current.currentExampleId).toBe('hola-mundo')
  })

  it('falls back to INITIAL_FILES when hola-mundo is absent', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    expect(result.current.files.map(f => f.name)).toEqual(['main.rkt', 'utils.rkt'])
    expect(result.current.activeFileId).toBe('main')
  })

  it('updateFile changes the content of the matching file only', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() => result.current.updateFile('main', 'nuevo contenido'))
    expect(result.current.files.find(f => f.id === 'main')?.content).toBe('nuevo contenido')
    expect(result.current.files.find(f => f.id === 'utils')?.content).not.toBe('nuevo contenido')
  })

  it('loadExample replaces files and bumps revision for existing ids', () => {
    const { result } = renderHook(() => useProjectFiles([holaMundo]))
    act(() => result.current.loadExample(holaMundo))
    expect(result.current.files.find(f => f.id === 'main')?.revision).toBe(1)
    expect(result.current.currentExampleId).toBe('hola-mundo')
    expect(result.current.activeFileId).toBe('main')
  })

  it('loadExample without files updates only main.rkt content and lockedLines', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() => result.current.loadExample(otherExample))
    const main = result.current.files.find(f => f.id === 'main')
    expect(main?.content).toBe('(display 2)')
    expect(main?.lockedLines).toEqual([1])
    expect(result.current.activeFileId).toBe('main')
  })

  it('applyGeneratedGrammar upserts grammar files and switches to main', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() => result.current.setActiveFileId('utils'))
    act(() =>
      result.current.applyGeneratedGrammar({
        input: 'bnf input',
        grammarRkt: 'grammar code',
        environmentRkt: 'env code',
        mainRkt: 'main code',
        mainLockedLines: [1, 2],
        utilsRkt: 'utils code',
      })
    )
    expect(result.current.files.find(f => f.id === 'grammar-input')?.content).toBe('bnf input')
    expect(result.current.files.find(f => f.id === 'grammar-rkt')?.content).toBe('grammar code')
    expect(result.current.files.find(f => f.id === 'environment-rkt')?.content).toBe('env code')
    expect(result.current.files.find(f => f.id === 'main')?.content).toBe('main code')
    expect(result.current.files.find(f => f.id === 'utils')?.content).toBe('utils code')
    expect(result.current.activeFileId).toBe('main')
  })

  it('getInitEnvBindings returns [] when there is no environment.rkt file', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    expect(result.current.getInitEnvBindings()).toEqual([])
  })

  it('getInitEnvBindings parses bindings from environment.rkt', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() =>
      result.current.applyGeneratedGrammar({
        input: '',
        grammarRkt: '',
        environmentRkt: `(define init-env (lambda () (extend-env '(x) '(1) (empty-env))))`,
        mainRkt: '',
        mainLockedLines: [],
        utilsRkt: '',
      })
    )
    expect(result.current.getInitEnvBindings()).toEqual([{ name: 'x', value: '1' }])
  })

  it('applyInitEnv does nothing when there is no environment.rkt file', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    const before = result.current.files
    act(() => result.current.applyInitEnv([{ name: 'x', value: '1' }]))
    expect(result.current.files).toBe(before)
  })

  it('applyInitEnv updates environment.rkt content and bumps its revision', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() =>
      result.current.applyGeneratedGrammar({
        input: '',
        grammarRkt: '',
        environmentRkt: `(define init-env\n  (lambda ()\n    (empty-env)))`,
        mainRkt: '',
        mainLockedLines: [],
        utilsRkt: '',
      })
    )
    act(() => result.current.applyInitEnv([{ name: 'y', value: '2' }]))
    const envFile = result.current.files.find(f => f.name === 'environment.rkt')
    expect(envFile?.content).toContain("'(y)")
    expect(envFile?.revision).toBe(1)
  })

  it('download calls downloadZip with the current files', () => {
    const { result } = renderHook(() => useProjectFiles([]))
    act(() => result.current.download())
    expect(downloadZip).toHaveBeenCalledWith(result.current.files)
  })
})
