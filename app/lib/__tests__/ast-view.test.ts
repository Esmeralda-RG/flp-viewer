import { describe, it, expect } from 'vitest'
import { normalize, categorize, renderValue, CAT } from '../ast-view'
import type { ASTNode } from '@/app/types/ast'

describe('normalize', () => {
  it('collapses a single string child into value on parent', () => {
    const node: ASTNode = { type: 'var-exp', children: [{ type: 'string', value: 'x' }] }
    expect(normalize(node)).toEqual({ type: 'var-exp', value: 'x' })
  })

  it('collapses a single number child into value on parent', () => {
    const node: ASTNode = { type: 'lit-exp', children: [{ type: 'number', value: 5 }] }
    expect(normalize(node)).toEqual({ type: 'lit-exp', value: 5 })
  })

  it('unwraps num-exp/decl-exp/bool-exp with a single child', () => {
    const node: ASTNode = { type: 'num-exp', children: [{ type: 'call-exp', children: [] }] }
    expect(normalize(node)).toEqual({ type: 'call-exp', children: undefined })
  })

  it('unwraps list nodes with a single child', () => {
    const node: ASTNode = { type: 'list', children: [{ type: 'call-exp', children: [] }] }
    expect(normalize(node)).toEqual({ type: 'call-exp', children: undefined })
  })

  it('filters out empty list children', () => {
    const node: ASTNode = {
      type: 'call-exp',
      children: [{ type: 'list', children: [] }, { type: 'string', value: 'x' }],
    }
    const result = normalize(node)
    expect(result.children).toBeUndefined()
    expect(result.value).toBe('x')
  })

  it('recursively normalizes nested children', () => {
    const node: ASTNode = {
      type: 'call-exp',
      children: [
        { type: 'a-program', children: [{ type: 'string', value: 'a' }] },
        { type: 'a-program', children: [{ type: 'string', value: 'b' }] },
      ],
    }
    const result = normalize(node)
    expect(result.children).toEqual([
      { type: 'a-program', value: 'a' },
      { type: 'a-program', value: 'b' },
    ])
  })

  it('handles nodes with no children', () => {
    const node: ASTNode = { type: 'number', value: 3 }
    expect(normalize(node)).toEqual({ type: 'number', value: 3, children: undefined })
  })
})

describe('categorize', () => {
  it('categorizes program nodes', () => {
    expect(categorize('a-program')).toBe('program')
    expect(categorize('a-programa')).toBe('program')
  })

  it('categorizes declaration nodes', () => {
    expect(categorize('let-exp')).toBe('decl')
    expect(categorize('letrec-exp')).toBe('decl')
    expect(categorize('var-let-exp')).toBe('decl')
    expect(categorize('decl-exp')).toBe('decl')
  })

  it('categorizes conditional nodes', () => {
    expect(categorize('if-exp')).toBe('cond')
  })

  it('categorizes call nodes', () => {
    expect(categorize('call-exp')).toBe('call')
  })

  it('categorizes function nodes', () => {
    expect(categorize('func-exp')).toBe('func')
    expect(categorize('proc-exp')).toBe('func')
  })

  it('categorizes variable nodes', () => {
    expect(categorize('var-exp')).toBe('var')
    expect(categorize('string')).toBe('var')
  })

  it('categorizes numeric nodes', () => {
    expect(categorize('decimal-num')).toBe('num')
    expect(categorize('float-num')).toBe('num')
    expect(categorize('number')).toBe('num')
    expect(categorize('lit-exp')).toBe('num')
  })

  it('categorizes boolean nodes', () => {
    expect(categorize('true-exp')).toBe('bool')
    expect(categorize('false-exp')).toBe('bool')
    expect(categorize('boolean')).toBe('bool')
  })

  it('categorizes primitive operation nodes', () => {
    expect(categorize('diff-exp')).toBe('op')
    expect(categorize('zero?-exp')).toBe('op')
    expect(categorize('foo-prim')).toBe('op')
    expect(categorize('prim-num-exp')).toBe('op')
    expect(categorize('prim-bool-exp')).toBe('op')
  })

  it('is case-insensitive', () => {
    expect(categorize('IF-EXP')).toBe('cond')
  })

  it('falls back to other for unrecognized types', () => {
    expect(categorize('mystery-node')).toBe('other')
  })

  it('has a CAT entry for every category', () => {
    expect(Object.keys(CAT).sort()).toEqual(
      ['program', 'decl', 'cond', 'call', 'func', 'var', 'num', 'bool', 'op', 'other'].sort()
    )
  })
})

describe('renderValue', () => {
  it('quotes strings', () => {
    expect(renderValue('hola')).toBe('"hola"')
  })

  it('renders true as #t', () => {
    expect(renderValue(true)).toBe('#t')
  })

  it('renders false as #f', () => {
    expect(renderValue(false)).toBe('#f')
  })

  it('stringifies numbers', () => {
    expect(renderValue(42)).toBe('42')
  })
})
