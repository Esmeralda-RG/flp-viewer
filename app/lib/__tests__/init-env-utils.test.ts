import { describe, it, expect } from 'vitest'
import { inferType, parseInitEnv, generateInitEnvDef, updateInitEnvInContent } from '../init-env-utils'

describe('inferType', () => {
  it('infers integers as number', () => {
    expect(inferType('42')).toBe('number')
    expect(inferType('-7')).toBe('number')
  })

  it('infers decimals as number', () => {
    expect(inferType('3.14')).toBe('number')
  })

  it('infers quoted text as string', () => {
    expect(inferType('"hola"')).toBe('string')
  })

  it('infers #t/#f as boolean', () => {
    expect(inferType('#t')).toBe('boolean')
    expect(inferType('#f')).toBe('boolean')
  })

  it('infers quoted parens as list', () => {
    expect(inferType("'(1 2 3)")).toBe('list')
  })

  it('infers quoted identifiers as symbol', () => {
    expect(inferType("'foo")).toBe('symbol')
  })

  it('falls back to value for anything else', () => {
    expect(inferType('foo')).toBe('value')
  })
})

describe('parseInitEnv', () => {
  it('returns empty array when no init-env definition is found', () => {
    expect(parseInitEnv('(define x 1)')).toEqual([])
  })

  it('parses names and values from an extend-env definition', () => {
    const content = `(define init-env
  (lambda ()
    (extend-env
     '(x y)
     '(1 2)
     (empty-env))))`
    expect(parseInitEnv(content)).toEqual([
      { name: 'x', value: '1' },
      { name: 'y', value: '2' },
    ])
  })

  it('defaults missing values to 0', () => {
    const content = `(define init-env (lambda () (extend-env '(x y) '(1) (empty-env))))`
    expect(parseInitEnv(content)).toEqual([
      { name: 'x', value: '1' },
      { name: 'y', value: '0' },
    ])
  })
})

describe('generateInitEnvDef', () => {
  it('generates an empty-env definition when there are no bindings', () => {
    expect(generateInitEnvDef([])).toBe('(define init-env\n  (lambda ()\n    (empty-env)))')
  })

  it('generates an extend-env definition for bindings', () => {
    const result = generateInitEnvDef([{ name: 'x', value: '1' }, { name: 'y', value: '2' }])
    expect(result).toContain("'(x y)")
    expect(result).toContain("'(1 2)")
    expect(result).toContain('extend-env')
  })
})

describe('updateInitEnvInContent', () => {
  it('replaces an existing init-env definition using empty-env', () => {
    const content = `(define init-env\n  (lambda ()\n    (empty-env)))\n(other-code)`
    const updated = updateInitEnvInContent(content, [{ name: 'x', value: '1' }])
    expect(updated).toContain("'(x)")
    expect(updated).toContain('(other-code)')
  })

  it('replaces an existing extend-env definition regardless of closing paren count', () => {
    const content = `(define init-env (lambda () (extend-env '(a) '(1) (empty-env))))`
    const updated = updateInitEnvInContent(content, [])
    expect(updated).toBe('(define init-env\n  (lambda ()\n    (empty-env)))')
  })
})
