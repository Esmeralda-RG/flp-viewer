import { describe, it, expect } from 'vitest'
import { STUB_RE, SCHEME_COLORS, EDITOR_OPTIONS, DEFAULT_LEX, DEFAULT_GRAMMAR } from '../grammar-defaults'

describe('STUB_RE', () => {
  it('matches a stub comment line and captures the label', () => {
    const match = STUB_RE.exec('  ; ⚠ "diff-exp" — falta implementar')
    expect(match?.[2]).toBe('diff-exp')
  })

  it('does not match a regular comment', () => {
    expect(STUB_RE.exec('; a normal comment')).toBeNull()
  })
})

describe('SCHEME_COLORS', () => {
  it('matches #lang lines', () => {
    const [re, color] = SCHEME_COLORS[0]
    expect(re.test('#lang eopl')).toBe(true)
    expect(color).toBe('text-green-400')
  })

  it('matches define lines', () => {
    const [re] = SCHEME_COLORS.find(([, c]) => c === 'text-blue-400')!
    expect(re.test('  (define x 1)')).toBe(true)
  })

  it('matches provide lines', () => {
    const [re] = SCHEME_COLORS.find(([, c]) => c === 'text-purple-400')!
    expect(re.test('(provide foo)')).toBe(true)
  })

  it('matches comment lines', () => {
    const zincEntries = SCHEME_COLORS.filter(([, c]) => c === 'text-zinc-400')
    expect(zincEntries.some(([re]) => re.test('; a comment'))).toBe(true)
    expect(zincEntries.some(([re]) => re.test(';; a double comment'))).toBe(true)
  })
})

describe('EDITOR_OPTIONS', () => {
  it('disables the minimap and enables word wrap', () => {
    expect(EDITOR_OPTIONS.minimap.enabled).toBe(false)
    expect(EDITOR_OPTIONS.wordWrap).toBe('on')
  })
})

describe('defaults', () => {
  it('DEFAULT_LEX includes number and identifier tokens', () => {
    expect(DEFAULT_LEX).toContain('number')
    expect(DEFAULT_LEX).toContain('identifier')
  })

  it('DEFAULT_GRAMMAR defines a program rule', () => {
    expect(DEFAULT_GRAMMAR).toContain('<program>')
    expect(DEFAULT_GRAMMAR).toContain('lit-exp')
  })
})
