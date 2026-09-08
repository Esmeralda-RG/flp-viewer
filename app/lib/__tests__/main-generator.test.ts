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

  describe('arbno groups with multiple symbols', () => {
    // SLLGEN expande `(arbno a b)` en dos campos paralelos (uno por símbolo
    // no terminal), no en un único campo de tuplas — confirmado ejecutando
    // eopl real. El stub debe reflejar esa aridad o `cases` falla en tiempo
    // de carga con "wrong field count".
    const arithGrammar = [
      '<expr> ::= <term> (<op> <val>)* => arith-exp',
      '<op> ::= "+" => plus-op',
      '<val> ::= <number> => lit-exp',
    ].join('\n')

    it('emits one field per non-terminal in the group, not a single "items" field', () => {
      const { content } = gen(arithGrammar)
      expect(content).toContain('(arith-exp (term ops vals)')
    })

    it('does not use the old single-field shape for multi-symbol groups', () => {
      const { content } = gen(arithGrammar)
      expect(content).not.toContain('(arith-exp (term items)')
    })

    it('drops terminal-only symbols inside the group (no field for them)', () => {
      const grammarWithKeyword = '<expr> ::= <base> ("key" <val>)* => mix-exp\n<base> ::= <number> => lit-exp\n<val> ::= <number> => lit-exp'
      const { content } = gen(grammarWithKeyword)
      expect(content).toContain('(mix-exp (base vals)')
    })

    it('still uses a single "items" field for the separated-list pattern', () => {
      const grammarWithSepList = '<call> ::= <identifier> "(" [<expr> ("," <expr>)*] ")" => call-exp\n<expr> ::= <number> => lit-exp'
      const { content } = gen(grammarWithSepList)
      expect(content).toContain('(call-exp (id items)')
    })
  })
})
