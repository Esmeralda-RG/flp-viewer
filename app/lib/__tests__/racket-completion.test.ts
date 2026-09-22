import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractDefinedNames } from '../racket-completion'

describe('extractDefinedNames', () => {
  it('extracts a simple variable define', () => {
    expect(extractDefinedNames('(define x 1)')).toEqual(['x'])
  })

  it('extracts a function define, ignoring its arguments', () => {
    expect(extractDefinedNames('(define (suma a b) (+ a b))')).toEqual(['suma'])
  })

  it('extracts multiple defines across lines, de-duplicated', () => {
    const text = '(define x 1)\n(define (f a) a)\n(define x 2)'
    expect(extractDefinedNames(text)).toEqual(['x', 'f'])
  })

  it('ignores defines inside commented-out lines', () => {
    const text = '; (define oculto 1)\n(define visible 2)'
    expect(extractDefinedNames(text)).toEqual(['visible'])
  })

  it('returns an empty array when there are no defines', () => {
    expect(extractDefinedNames('(+ 1 2)')).toEqual([])
  })
})

describe('registerRacketCompletionProvider', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  function makeMonaco() {
    return {
      languages: {
        registerCompletionItemProvider: vi.fn(),
        CompletionItemKind: { Function: 1, Keyword: 2, Variable: 3 },
      },
    }
  }

  it('registers a completion provider for scheme', async () => {
    const { registerRacketCompletionProvider } = await import('../racket-completion')
    const monaco = makeMonaco()
    registerRacketCompletionProvider(monaco as any, [])
    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith('scheme', expect.any(Object))
  })

  it('does not register twice (singleton guard)', async () => {
    const { registerRacketCompletionProvider } = await import('../racket-completion')
    const monaco1 = makeMonaco()
    registerRacketCompletionProvider(monaco1 as any, [])
    const monaco2 = makeMonaco()
    registerRacketCompletionProvider(monaco2 as any, [])
    expect(monaco2.languages.registerCompletionItemProvider).not.toHaveBeenCalled()
  })

  it('registers even with an empty glossary (keywords still apply)', async () => {
    const { registerRacketCompletionProvider } = await import('../racket-completion')
    const monaco = makeMonaco()
    registerRacketCompletionProvider(monaco as any, [])
    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledOnce()
  })

  it('provideCompletionItems mixes glossary, keyword and own-define suggestions', async () => {
    const { registerRacketCompletionProvider } = await import('../racket-completion')
    const monaco = makeMonaco()
    const terms = [{ term: 'apply-env', title: 'apply-env', md: 'busca una variable' }]
    registerRacketCompletionProvider(monaco as any, terms)

    const providerArg = monaco.languages.registerCompletionItemProvider.mock.calls[0][1]
    const model = {
      getWordUntilPosition: () => ({ startColumn: 1, endColumn: 1 }),
      getValue: () => '(define contador 0)',
    }
    const position = { lineNumber: 1, column: 1 }
    const { suggestions } = providerArg.provideCompletionItems(model, position)
    const labels = suggestions.map((s: { label: string }) => s.label)

    expect(labels).toContain('apply-env')
    expect(labels).toContain('lambda')
    expect(labels).toContain('contador')
  })
})
