import { describe, it, expect } from 'vitest'
import { findTermAtPosition } from '../glossary-match'
import type { GlossaryTerm } from '@/app/types/glossary'

function term(t: string): GlossaryTerm {
  return { term: t, title: t, md: `docs for ${t}` }
}

describe('findTermAtPosition', () => {
  it('finds a term at the given column', () => {
    const terms = [term('define')]
    const match = findTermAtPosition('(define x 1)', 3, terms)
    expect(match?.term.term).toBe('define')
  })

  it('returns null when no term matches', () => {
    const terms = [term('define')]
    expect(findTermAtPosition('(lambda (x) x)', 3, terms)).toBeNull()
  })

  it('returns null when the column falls outside any term occurrence', () => {
    const terms = [term('define')]
    expect(findTermAtPosition('(define x 1)', 100, terms)).toBeNull()
  })

  it('requires word boundaries around the term', () => {
    const terms = [term('let')]
    expect(findTermAtPosition('(letrec ((x 1)) x)', 3, terms)).toBeNull()
  })

  it('matches the longest term when multiple overlap', () => {
    const terms = [term('let'), term('letrec')]
    const match = findTermAtPosition('(letrec ((x 1)) x)', 3, terms)
    expect(match?.term.term).toBe('letrec')
  })

  it('finds a later occurrence of the same term', () => {
    const terms = [term('x')]
    const match = findTermAtPosition('(+ a x)', 6, terms)
    expect(match?.term.term).toBe('x')
  })

  it('computes 1-based start and end columns', () => {
    const terms = [term('foo')]
    const match = findTermAtPosition('foo', 1, terms)
    expect(match).toEqual({ term: terms[0], startColumn: 1, endColumn: 4 })
  })
})
