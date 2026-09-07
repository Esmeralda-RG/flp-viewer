import { describe, it, expect } from 'vitest'
import { loadGlossaryTerms } from '../load-glossary'

describe('loadGlossaryTerms', () => {
  it('loads every markdown file in the glossary directory', () => {
    const terms = loadGlossaryTerms()
    expect(terms.length).toBeGreaterThan(0)
  })

  it('parses required frontmatter fields', () => {
    const terms = loadGlossaryTerms()
    for (const t of terms) {
      expect(typeof t.term).toBe('string')
      expect(t.term.length).toBeGreaterThan(0)
      expect(typeof t.title).toBe('string')
      expect(typeof t.md).toBe('string')
    }
  })
})
