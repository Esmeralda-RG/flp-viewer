import { describe, it, expect } from 'vitest'
import { tokenize, LexError } from '../bnf-lexer'

describe('tokenize', () => {
  it('produces EOF for empty input', () => {
    const toks = tokenize('')
    expect(toks).toHaveLength(1)
    expect(toks[0].kind).toBe('EOF')
  })

  it('tokenizes a minimal rule', () => {
    const toks = tokenize('<expr> ::= "let"')
    const kinds = toks.map(t => t.kind)
    expect(kinds).toEqual(['NONTERMINAL', 'PRODUCES', 'TERMINAL', 'EOF'])
    expect(toks[0].value).toBe('expr')
    expect(toks[2].value).toBe('let')
  })

  it('tokenizes alternation', () => {
    const toks = tokenize('<a> ::= <b> | <c>')
    const kinds = toks.map(t => t.kind)
    expect(kinds).toEqual(['NONTERMINAL', 'PRODUCES', 'NONTERMINAL', 'ALT', 'NONTERMINAL', 'EOF'])
  })

  it('tokenizes quantifiers', () => {
    const toks = tokenize('* + ?')
    expect(toks[0].kind).toBe('STAR')
    expect(toks[1].kind).toBe('PLUS')
    expect(toks[2].kind).toBe('QUESTION')
  })

  it('tokenizes grouping brackets', () => {
    const toks = tokenize('( ) [ ]')
    const kinds = toks.map(t => t.kind)
    expect(kinds).toEqual(['LPAREN', 'RPAREN', 'LBRACKET', 'RBRACKET', 'EOF'])
  })

  it('tokenizes arrow =>', () => {
    const toks = tokenize('=>')
    expect(toks[0].kind).toBe('ARROW')
  })

  it('tokenizes identifiers with hyphens and question marks', () => {
    const toks = tokenize('empty?-prim')
    expect(toks[0].kind).toBe('IDENT')
    expect(toks[0].value).toBe('empty?-prim')
  })

  it('skips ; line comments', () => {
    const toks = tokenize('; this is a comment\n<a> ::= <b>')
    expect(toks[0].kind).toBe('NONTERMINAL')
    expect(toks[0].value).toBe('a')
  })

  it('skips // line comments', () => {
    const toks = tokenize('// comment\n<x> ::= "y"')
    expect(toks[0].kind).toBe('NONTERMINAL')
  })

  it('skips # line comments', () => {
    const toks = tokenize('# comment\n<x> ::= "y"')
    expect(toks[0].kind).toBe('NONTERMINAL')
  })

  it('tracks line numbers correctly', () => {
    const toks = tokenize('<a> ::= "x"\n<b> ::= "y"')
    const b = toks.find(t => t.value === 'b')!
    expect(b.line).toBe(2)
  })

  it('handles single-quoted terminals', () => {
    const toks = tokenize("<a> ::= 'hello'")
    const term = toks.find(t => t.kind === 'TERMINAL')!
    expect(term.value).toBe('hello')
  })

  it('throws LexError for unclosed non-terminal', () => {
    expect(() => tokenize('<unclosed')).toThrowError(LexError)
  })

  it('throws LexError for unclosed terminal', () => {
    expect(() => tokenize('"unclosed')).toThrowError(LexError)
  })

  it('includes line and col in LexError', () => {
    try {
      tokenize('<unclosed')
    } catch (err) {
      expect(err).toBeInstanceOf(LexError)
      expect((err as LexError).line).toBe(1)
    }
  })
})
