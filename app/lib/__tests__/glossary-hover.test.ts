import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('registerGlossaryHoverProvider', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  function makeMonaco() {
    return {
      languages: { registerHoverProvider: vi.fn() },
      Range: vi.fn(function (...args: number[]) { return { range: args } }),
    }
  }

  it('registers a hover provider when terms are present', async () => {
    const { registerGlossaryHoverProvider } = await import('../glossary-hover')
    const monaco = makeMonaco()
    registerGlossaryHoverProvider(monaco as any, [{ term: 'define', title: 'Define', md: 'docs' }])
    expect(monaco.languages.registerHoverProvider).toHaveBeenCalledWith('scheme', expect.any(Object))
  })

  it('does not register twice (singleton guard)', async () => {
    const { registerGlossaryHoverProvider } = await import('../glossary-hover')
    const monaco1 = makeMonaco()
    registerGlossaryHoverProvider(monaco1 as any, [{ term: 'define', title: 'Define', md: 'docs' }])
    const monaco2 = makeMonaco()
    registerGlossaryHoverProvider(monaco2 as any, [{ term: 'define', title: 'Define', md: 'docs' }])
    expect(monaco2.languages.registerHoverProvider).not.toHaveBeenCalled()
  })

  it('does nothing when there are no terms', async () => {
    const { registerGlossaryHoverProvider } = await import('../glossary-hover')
    const monaco = makeMonaco()
    registerGlossaryHoverProvider(monaco as any, [])
    expect(monaco.languages.registerHoverProvider).not.toHaveBeenCalled()
  })

  it('provideHover returns a hover result when a term matches', async () => {
    const { registerGlossaryHoverProvider } = await import('../glossary-hover')
    const monaco = makeMonaco()
    const terms = [{ term: 'define', title: 'Define', md: 'crea una variable' }]
    registerGlossaryHoverProvider(monaco as any, terms)

    const providerArg = monaco.languages.registerHoverProvider.mock.calls[0][1]
    const model = { getLineContent: () => '(define x 1)' }
    const position = { lineNumber: 1, column: 3 }
    const hover = providerArg.provideHover(model, position)
    expect(hover.contents[0].value).toContain('Define')
    expect(hover.contents[0].value).toContain('crea una variable')
  })

  it('provideHover returns null when no term matches', async () => {
    const { registerGlossaryHoverProvider } = await import('../glossary-hover')
    const monaco = makeMonaco()
    const terms = [{ term: 'define', title: 'Define', md: 'crea una variable' }]
    registerGlossaryHoverProvider(monaco as any, terms)

    const providerArg = monaco.languages.registerHoverProvider.mock.calls[0][1]
    const model = { getLineContent: () => '(lambda (x) x)' }
    const position = { lineNumber: 1, column: 3 }
    expect(providerArg.provideHover(model, position)).toBeNull()
  })
})
