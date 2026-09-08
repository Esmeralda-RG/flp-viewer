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

  it.each([
    ['generates a-program for first program production', '<program> ::= <expression>', 'a-program'],
    ['uses explicit variant name from =>', '<expression> ::= "let" <identifier> => let-exp', 'let-exp'],
    ['generates (arbno ...) for * quantifier on nonterminal', '<expr> ::= <arg>*', '(arbno arg)'],
    ['generates "X (arbno X)" for + quantifier on nonterminal', '<expr> ::= <arg>+', 'arg (arbno arg)'],
    ['generates "(arbno X) ; opcional" for ? quantifier on nonterminal', '<expr> ::= <arg>?', '(arbno arg) ; opcional'],
    ['generates (separated-list ...) for [<A> ("sep" <A>)*] pattern', '<expr> ::= [<item> ("," <item>)*]', '(separated-list item ",")'],
    ['generates (separated-list ...) for legacy (A sep)* shorthand', '<expr> ::= (<item> ",")*', '(separated-list item ",")'],
    ['flattens a bare group without quantifier', '<expr> ::= ("let" <identifier>)', '"let" identifier'],
    ['generates (arbno ...) for multi-item group with *', '<expr> ::= ("a" <b>)*', '(arbno "a" b)'],
    ['generates "X (arbno X)" for multi-item group with +', '<expr> ::= (<a> <b>)+', '(arbno a b)'],
    ['generates "(arbno ...) ; opcional" for multi-item group with ?', '<expr> ::= (<a> <b>)?', '(arbno a b) ; opcional'],
    ['escapes double quotes in terminal values', '<expr> ::= "let"', '"let"'],
  ])('%s', (_name, input, expected) => {
    const ast = parseStr(input)
    const out = generateGrammarRkt(ast, '')
    expect(out).toContain(expected)
  })
})
