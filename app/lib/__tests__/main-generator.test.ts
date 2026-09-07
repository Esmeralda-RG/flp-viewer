import { describe, it, expect } from 'vitest'
import { tokenize } from '../bnf-lexer'
import { parse } from '../bnf-parser'
import { generateMainRkt } from '../main-generator'

function gen(input: string) {
  return generateMainRkt(parse(tokenize(input)))
}

describe('generateMainRkt', () => {
  const grammar = '<program> ::= <expression>\n<expression> ::= <number> | "let" <identifier> "=" <expression> "in" <expression>'

  it('starts with #lang eopl', () => {
    const { content } = gen(grammar)
    expect(content.startsWith('#lang eopl')).toBe(true)
  })

  it('requires grammar.rkt, environment.rkt and utils.rkt', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(require "grammar.rkt")')
    expect(content).toContain('(require "environment.rkt")')
    expect(content).toContain('(require "utils.rkt")')
  })

  it('defines scan&parse', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(define scan&parse')
  })

  it('defines interpreter', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(define interpreter')
  })

  it('generates eval-program for program rule', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(define eval-program')
  })

  it('generates eval-expression for expression rule', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(define eval-expression')
  })

  it('returns locked line numbers', () => {
    const { lockedLines } = gen(grammar)
    expect(lockedLines.length).toBeGreaterThan(0)
  })

  it('all locked line numbers are valid 1-based indices', () => {
    const { content, lockedLines } = gen(grammar)
    const totalLines = content.split('\n').length
    for (const ln of lockedLines) {
      expect(ln).toBeGreaterThanOrEqual(1)
      expect(ln).toBeLessThanOrEqual(totalLines)
    }
  })

  it('generates TODO placeholders for non-program variants', () => {
    const { content } = gen(grammar)
    expect(content).toContain('TODO')
  })

  it('auto-generates eval-expression with env parameter', () => {
    const { content } = gen(grammar)
    expect(content).toContain('(lambda (exp env)')
  })

  it('uses explicit variant name from =>', () => {
    const { content } = gen('<expression> ::= "zero" => zero-exp')
    expect(content).toContain('zero-exp')
  })

  it('a-program body calls eval-expression with init-env', () => {
    const { content } = gen('<program> ::= <expression>')
    expect(content).toContain('(eval-expression')
    expect(content).toContain('(init-env)')
  })

  it('ends with commented interpreter call', () => {
    const { content } = gen(grammar)
    expect(content).toContain('; (interpreter)')
  })
})
