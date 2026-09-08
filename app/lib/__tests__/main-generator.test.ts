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

  it.each([
    ['defines scan&parse', grammar, '(define scan&parse'],
    ['defines interpreter', grammar, '(define interpreter'],
    ['generates eval-program for program rule', grammar, '(define eval-program'],
    ['generates eval-expression for expression rule', grammar, '(define eval-expression'],
    ['generates TODO placeholders for non-program variants', grammar, 'TODO'],
    ['auto-generates eval-expression with env parameter', grammar, '(lambda (exp env)'],
    ['uses explicit variant name from =>', '<expression> ::= "zero" => zero-exp', 'zero-exp'],
  ])('%s', (_name, input, expected) => {
    const { content } = gen(input)
    expect(content).toContain(expected)
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
