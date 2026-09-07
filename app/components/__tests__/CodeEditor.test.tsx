import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type { OnMount } from '@monaco-editor/react'

const { MockMonacoEditor, propsRef } = vi.hoisted(() => {
  const propsRef: { current: any } = { current: null }
  function MockMonacoEditor(props: any) {
    propsRef.current = props
    return null
  }
  return { MockMonacoEditor, propsRef }
})

vi.mock('@monaco-editor/react', () => ({ default: MockMonacoEditor }))
vi.mock('next/dynamic', () => ({ default: () => MockMonacoEditor }))

import CodeEditor from '../editor/CodeEditor'

function makeModel(lines: string[]) {
  let changeCallback: ((event: any) => void) | null = null
  return {
    getLineCount: () => lines.length,
    getLineContent: (n: number) => lines[n - 1] ?? '',
    onDidChangeContent: vi.fn((cb: (event: any) => void) => { changeCallback = cb }),
    pushEditOperations: vi.fn(),
    triggerChange(event: any) { changeCallback?.(event) },
  }
}

function makeEditor(model: ReturnType<typeof makeModel> | null) {
  return {
    getModel: () => model,
    focus: vi.fn(),
    createDecorationsCollection: vi.fn(() => ({ set: vi.fn() })),
  }
}

const monaco = { Range: vi.fn(function (...args: number[]) { return { args } }) } as any

describe('CodeEditor', () => {
  beforeEach(() => {
    propsRef.current = null
  })

  it('renders the underlying monaco editor with the given value', () => {
    render(<CodeEditor value="(display 1)" onChange={vi.fn()} glossaryTerms={[]} />)
    expect(propsRef.current.value).toBe('(display 1)')
    expect(propsRef.current.language).toBe('scheme')
    expect(propsRef.current.theme).toBe('vs-dark')
  })

  it('forwards onChange, defaulting null to empty string', () => {
    const onChange = vi.fn()
    render(<CodeEditor value="" onChange={onChange} glossaryTerms={[]} />)
    propsRef.current.onChange(null)
    expect(onChange).toHaveBeenCalledWith('')
    propsRef.current.onChange('nuevo')
    expect(onChange).toHaveBeenCalledWith('nuevo')
  })

  it('focuses and returns early when there is no model', () => {
    render(<CodeEditor value="" onChange={vi.fn()} glossaryTerms={[]} />)
    const editor = makeEditor(null)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)
    expect(editor.focus).toHaveBeenCalledOnce()
  })

  it('focuses without registering a listener when there are no locked lines', () => {
    render(<CodeEditor value="a\nb" onChange={vi.fn()} glossaryTerms={[]} />)
    const model = makeModel(['a', 'b'])
    const editor = makeEditor(model)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)
    expect(editor.focus).toHaveBeenCalledOnce()
    expect(model.onDidChangeContent).not.toHaveBeenCalled()
  })

  it('ignores locked line numbers outside the document range', () => {
    render(<CodeEditor value="a" onChange={vi.fn()} glossaryTerms={[]} lockedLines={[0, 99]} />)
    const model = makeModel(['a'])
    const editor = makeEditor(model)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)
    expect(model.onDidChangeContent).not.toHaveBeenCalled()
    expect(editor.focus).toHaveBeenCalledOnce()
  })

  it('registers a change listener that restores a locked line that was edited', () => {
    render(<CodeEditor value="locked\nfree" onChange={vi.fn()} glossaryTerms={[]} lockedLines={[1]} />)
    const model = makeModel(['locked', 'free'])
    const editor = makeEditor(model)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)
    expect(model.onDidChangeContent).toHaveBeenCalledOnce()

    model.triggerChange({
      changes: [{ range: { startLineNumber: 1, endLineNumber: 1 }, text: 'hacked' }],
    })
    expect(model.pushEditOperations).toHaveBeenCalledOnce()
  })

  it('shifts tracked locked lines when unrelated edits add or remove lines', () => {
    render(<CodeEditor value="a\nlocked\nb" onChange={vi.fn()} glossaryTerms={[]} lockedLines={[2]} />)
    const model = makeModel(['a', 'locked', 'b'])
    const editor = makeEditor(model)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)

    model.triggerChange({
      changes: [{ range: { startLineNumber: 1, endLineNumber: 1 }, text: 'a\nnew-line' }],
    })
    expect(model.pushEditOperations).not.toHaveBeenCalled()
  })

  it('does not shift locked lines when the edit does not change line count', () => {
    render(<CodeEditor value="a\nlocked" onChange={vi.fn()} glossaryTerms={[]} lockedLines={[2]} />)
    const model = makeModel(['a', 'locked'])
    const editor = makeEditor(model)
    ;(propsRef.current.onMount as OnMount)(editor as any, monaco)

    model.triggerChange({
      changes: [{ range: { startLineNumber: 1, endLineNumber: 1 }, text: 'aa' }],
    })
    expect(model.pushEditOperations).not.toHaveBeenCalled()
  })
})
