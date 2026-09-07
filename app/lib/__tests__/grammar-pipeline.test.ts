import { describe, it, expect } from 'vitest'
import { runPipeline } from '../grammar-pipeline'

describe('runPipeline', () => {
  it('returns error for empty grammar', () => {
    const result = runPipeline('', '')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('vacía')
  })

  it('returns error for whitespace-only grammar', () => {
    const result = runPipeline('', '   \n  ')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns empty outputs on error', () => {
    const result = runPipeline('', '')
    expect(result.grammarRkt).toBe('')
    expect(result.environmentRkt).toBe('')
    expect(result.mainRkt).toBe('')
    expect(result.mainLockedLines).toEqual([])
  })

  it('processes a valid grammar without errors', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('', bnf)
    expect(result.errors).toEqual([])
  })

  it('generates all three files for a valid grammar', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('', bnf)
    expect(result.grammarRkt).toContain('#lang eopl')
    expect(result.environmentRkt).toBeTruthy()
    expect(result.mainRkt).toContain('#lang eopl')
  })

  it('reports lex errors for unknown tokens in lexInput', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('unknown-lextoken', bnf)
    expect(result.errors.some(e => e.includes('unknown-lextoken'))).toBe(true)
  })

  it('does not report errors for known lex keywords', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('number\nidentifier', bnf)
    expect(result.errors).toEqual([])
  })

  it('catches lexer errors and returns them as error strings', () => {
    const result = runPipeline('', '<unclosed')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.grammarRkt).toBe('')
  })

  it('catches parser errors and returns them as error strings', () => {
    const result = runPipeline('', '<expr> <number>')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.grammarRkt).toBe('')
  })

  it('returns locked lines from mainRkt', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('', bnf)
    expect(result.mainLockedLines.length).toBeGreaterThan(0)
  })

  it('applies custom lex rules to grammarRkt', () => {
    const bnf = '<program> ::= <expression>\n<expression> ::= <number>'
    const result = runPipeline('float', bnf)
    expect(result.grammarRkt).toContain('float')
  })
})
