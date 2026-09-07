import { describe, it, expect } from 'vitest'
import { tokenize } from '../bnf-lexer'
import { parse } from '../bnf-parser'
import { generateGrammarRkt, getLexErrors } from '../eopl-generator'

function parseStr(input: string) {
  return parse(tokenize(input))
}

describe('getLexErrors', () => {
  it('returns empty array for empty input', () => {
    expect(getLexErrors('')).toEqual([])
  })

  it('returns empty array for known keywords', () => {
    expect(getLexErrors('number\nidentifier')).toEqual([])
  })

  it('returns empty array for raw sllgen rules (start with "(")', () => {
    expect(getLexErrors('(myrule (digit) number)')).toEqual([])
  })

  it('reports unknown keywords', () => {
    const errors = getLexErrors('unknown-token')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('unknown-token')
  })

  it('ignores comment lines starting with ;', () => {
    const errors = getLexErrors('; this is a comment\nnumber')
    expect(errors).toEqual([])
  })

  it('accepts float, binary, octal, hex, text, string keywords', () => {
    const input = 'float\nbinary\noctal\nhex\ntext\nstring'
    expect(getLexErrors(input)).toEqual([])
  })
})

describe('generateGrammarRkt', () => {
  const simpleGrammar = '<program> ::= <expression>\n<expression> ::= <number>'

  it('starts with #lang eopl', () => {
    const ast = parseStr(simpleGrammar)
    const out = generateGrammarRkt(ast, '')
    expect(out.startsWith('#lang eopl')).toBe(true)
  })

  it('contains lexical-spec and grammar definitions', () => {
    const ast = parseStr(simpleGrammar)
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(define lexical-spec')
    expect(out).toContain('(define grammar')
  })

  it('ends with (provide lexical-spec grammar)', () => {
    const ast = parseStr(simpleGrammar)
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(provide lexical-spec grammar)')
  })

  it('includes default lexical rules when lex input is empty', () => {
    const ast = parseStr(simpleGrammar)
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('whitespace')
    expect(out).toContain('identifier')
  })

  it('uses custom lex keyword when provided', () => {
    const ast = parseStr(simpleGrammar)
    const out = generateGrammarRkt(ast, 'float')
    expect(out).toContain('float')
  })

  it('generates a-program for first program production', () => {
    const ast = parseStr('<program> ::= <expression>')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('a-program')
  })

  it('uses explicit variant name from =>', () => {
    const ast = parseStr('<expression> ::= "let" <identifier> => let-exp')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('let-exp')
  })

  it('generates (arbno ...) for * quantifier on nonterminal', () => {
    const ast = parseStr('<expr> ::= <arg>*')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(arbno arg)')
  })

  it('generates "X (arbno X)" for + quantifier on nonterminal', () => {
    const ast = parseStr('<expr> ::= <arg>+')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('arg (arbno arg)')
  })

  it('generates "(arbno X) ; opcional" for ? quantifier on nonterminal', () => {
    const ast = parseStr('<expr> ::= <arg>?')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(arbno arg) ; opcional')
  })

  it('generates (separated-list ...) for [<A> ("sep" <A>)*] pattern', () => {
    const ast = parseStr('<expr> ::= [<item> ("," <item>)*]')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(separated-list item ",")')
  })

  it('generates (separated-list ...) for legacy (A sep)* shorthand', () => {
    const ast = parseStr('<expr> ::= (<item> ",")*')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(separated-list item ",")')
  })

  it('flattens a bare group without quantifier', () => {
    const ast = parseStr('<expr> ::= ("let" <identifier>)')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('"let" identifier')
  })

  it('generates (arbno ...) for multi-item group with *', () => {
    const ast = parseStr('<expr> ::= ("a" <b>)*')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(arbno "a" b)')
  })

  it('generates "X (arbno X)" for multi-item group with +', () => {
    const ast = parseStr('<expr> ::= (<a> <b>)+')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(arbno a b)')
  })

  it('generates "(arbno ...) ; opcional" for multi-item group with ?', () => {
    const ast = parseStr('<expr> ::= (<a> <b>)?')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('(arbno a b) ; opcional')
  })

  it('escapes double quotes in terminal values', () => {
    const ast = parseStr('<expr> ::= "let"')
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain('"let"')
  })
})
