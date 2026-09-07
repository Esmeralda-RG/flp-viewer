import type { GlossaryTerm } from '@/app/types/glossary'

export interface TermMatch {
  term: GlossaryTerm
  startColumn: number
  endColumn: number
}

function isBoundary(ch: string | undefined): boolean {
  return ch === undefined || /[\s()[\]{}'"]/.test(ch)
}

export function findTermAtPosition(lineText: string, column: number, terms: GlossaryTerm[]): TermMatch | null {
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length)

  for (const t of sorted) {
    let idx = lineText.indexOf(t.term)
    while (idx !== -1) {
      const startColumn = idx + 1
      const endColumn = startColumn + t.term.length
      const before = lineText[idx - 1]
      const after = lineText[idx + t.term.length]
      if (isBoundary(before) && isBoundary(after) && column >= startColumn && column < endColumn) {
        return { term: t, startColumn, endColumn }
      }
      idx = lineText.indexOf(t.term, idx + 1)
    }
  }

  return null
}
