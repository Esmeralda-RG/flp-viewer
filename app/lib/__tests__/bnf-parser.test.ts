import { describe, it, expect } from 'vitest'
import { tokenize } from '../bnf-lexer'
import { parse, ParseError } from '../bnf-parser'

function parseStr(input: string) {
  return parse(tokenize(input))
}

describe('parse', () => {
  it('parses a single rule with a terminal', () => {
    const ast = parseStr('<expr> ::= "zero"')
    expect(ast.rules).toHaveLength(1)
    const rule = ast.rules[0]
    expect(rule.lhs).toBe('expr')
    expect(rule.productions).toHaveLength(1)
    expect(rule.productions[0].items[0]).toEqual({ kind: 'terminal', value: 'zero' })
  })

  it('parses a non-terminal reference', () => {
    const ast = parseStr('<expr> ::= <number>')
    const item = ast.rules[0].productions[0].items[0]
    expect(item).toEqual({ kind: 'nonterminal', name: 'number' })
  })

  it('parses alternatives', () => {
    const ast = parseStr('<expr> ::= "a" | "b" | "c"')
    expect(ast.rules[0].productions).toHaveLength(3)
  })

  it('parses multiple rules', () => {
    const ast = parseStr('<program> ::= <expr>\n<expr> ::= "x"')
    expect(ast.rules).toHaveLength(2)
    expect(ast.rules[0].lhs).toBe('program')
    expect(ast.rules[1].lhs).toBe('expr')
  })

  it('parses => variant name annotation', () => {
    const ast = parseStr('<expr> ::= "let" <identifier> => let-exp')
    const prod = ast.rules[0].productions[0]
    expect(prod.variantName).toBe('let-exp')
  })

  it('parses * quantifier on non-terminal', () => {
    const ast = parseStr('<expr> ::= <arg>*')
    const item = ast.rules[0].productions[0].items[0]
    expect(item).toEqual({ kind: 'nonterminal-rep', name: 'arg', op: '*' })
  })

  it('parses + quantifier on non-terminal', () => {
    const ast = parseStr('<expr> ::= <arg>+')
    const item = ast.rules[0].productions[0].items[0]
    expect(item).toEqual({ kind: 'nonterminal-rep', name: 'arg', op: '+' })
  })

  it('parses ? quantifier on non-terminal', () => {
    const ast = parseStr('<expr> ::= <arg>?')
    const item = ast.rules[0].productions[0].items[0]
    expect(item).toEqual({ kind: 'nonterminal-rep', name: 'arg', op: '?' })
  })

  it('parses (...)* group', () => {
    const ast = parseStr('<expr> ::= ("," <arg>)*')
    const item = ast.rules[0].productions[0].items[0]
    expect(item.kind).toBe('group')
    if (item.kind === 'group') {
      expect(item.op).toBe('*')
      expect(item.items).toHaveLength(2)
    }
  })

  it('parses [...] as optional group (?)', () => {
    const ast = parseStr('<expr> ::= ["opt"]')
    const item = ast.rules[0].productions[0].items[0]
    expect(item.kind).toBe('group')
    if (item.kind === 'group') {
      expect(item.op).toBe('?')
    }
  })

  it('parses IDENT as non-terminal reference (no angle brackets)', () => {
    const ast = parseStr('expr ::= number')
    expect(ast.rules[0].lhs).toBe('expr')
    expect(ast.rules[0].productions[0].items[0]).toEqual({ kind: 'nonterminal', name: 'number' })
  })

  it('throws ParseError for unclosed group', () => {
    expect(() => parseStr('<expr> ::= ("a"')).toThrowError(ParseError)
  })

  it('throws ParseError when PRODUCES is missing', () => {
    expect(() => parseStr('<expr> <number>')).toThrowError(ParseError)
  })

  it('throws ParseError for => without variant name', () => {
    expect(() => parseStr('<expr> ::= "a" =>')).toThrowError(ParseError)
  })
})
