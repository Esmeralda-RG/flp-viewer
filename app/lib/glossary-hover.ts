import type { Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditorNS, Position } from 'monaco-editor'
import type { GlossaryTerm } from '@/app/types/glossary'
import { findTermAtPosition } from './glossary-match'

let registered = false

// EditorPanel keeps all files mounted at once and remounts them on every
// revision bump (example load, grammar generation, init-env apply), so
// handleMount fires repeatedly — this guard keeps the provider a singleton
// for the page's lifetime instead of stacking duplicate hover tooltips.
export function registerGlossaryHoverProvider(monaco: Monaco, terms: GlossaryTerm[]): void {
  if (registered || terms.length === 0) return
  registered = true

  monaco.languages.registerHoverProvider('scheme', {
    provideHover(model: MonacoEditorNS.ITextModel, position: Position) {
      const lineText = model.getLineContent(position.lineNumber)
      const match = findTermAtPosition(lineText, position.column, terms)
      if (!match) return null

      return {
        range: new monaco.Range(position.lineNumber, match.startColumn, position.lineNumber, match.endColumn),
        contents: [{ value: `**${match.term.title}**\n\n${match.term.md}` }],
      }
    },
  })
}
