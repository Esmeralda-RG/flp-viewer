import { describe, it, expect } from 'vitest'
import { loadExamples } from '../load-examples'

describe('loadExamples', () => {
  it('loads every example directory with a meta.json', async () => {
    const examples = await loadExamples()
    expect(examples.length).toBeGreaterThan(0)
  })

  it('populates required fields and resolves the active file content', async () => {
    const examples = await loadExamples()
    for (const ex of examples) {
      expect(typeof ex.id).toBe('string')
      expect(typeof ex.label).toBe('string')
      expect(typeof ex.code).toBe('string')
      expect(ex.files.length).toBeGreaterThan(0)
      const active = ex.files.find(f => f.id === ex.activeFileId)
      expect(active?.content).toBe(ex.code)
    }
  })

  it('sorts examples by the order declared in each meta.json', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const examplesDir = path.join(process.cwd(), 'examples')

    const examples = await loadExamples()
    for (let i = 1; i < examples.length; i++) {
      const prevOrder = JSON.parse(fs.readFileSync(path.join(examplesDir, examples[i - 1].id, 'meta.json'), 'utf-8')).order ?? Number.MAX_SAFE_INTEGER
      const currOrder = JSON.parse(fs.readFileSync(path.join(examplesDir, examples[i].id, 'meta.json'), 'utf-8')).order ?? Number.MAX_SAFE_INTEGER
      expect(prevOrder <= currOrder).toBe(true)
    }
  })

  it('does not leak the internal order field', async () => {
    const examples = await loadExamples()
    expect(examples[0]).not.toHaveProperty('order')
  })
})
