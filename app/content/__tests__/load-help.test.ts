import { describe, it, expect } from 'vitest'
import { loadHelpSections } from '../load-help'

describe('loadHelpSections', () => {
  it('loads every markdown file in the help directory', () => {
    const sections = loadHelpSections()
    expect(sections.length).toBeGreaterThan(0)
  })

  it('parses required frontmatter fields', () => {
    const sections = loadHelpSections()
    for (const s of sections) {
      expect(typeof s.id).toBe('string')
      expect(s.id.length).toBeGreaterThan(0)
      expect(typeof s.icon).toBe('string')
      expect(typeof s.title).toBe('string')
      expect(typeof s.order).toBe('number')
      expect(typeof s.md).toBe('string')
    }
  })

  it('sorts sections by order then title', () => {
    const sections = loadHelpSections()
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1]
      const curr = sections[i]
      const orderOk =
        prev.order < curr.order ||
        (prev.order === curr.order && prev.title.localeCompare(curr.title) <= 0)
      expect(orderOk).toBe(true)
    }
  })
})
