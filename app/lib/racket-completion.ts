import type { Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditorNS, Position } from 'monaco-editor'
import type { GlossaryTerm } from '@/app/types/glossary'

let registered = false

const KEYWORDS = [
  'lambda', 'let', 'let*', 'letrec', 'cond', 'else', 'and', 'or', 'not',
  'begin', 'set!', 'quote', 'case', 'if',
]

const DEFINE_RE = /\(define[ \t]+(?:\([ \t]*)?([A-Za-z_][\w?!*+\-<>=/]*)/

export function extractDefinedNames(text: string): string[] {
  const names = new Set<string>()
  for (const line of text.split('\n')) {
    if (line.trim().startsWith(';')) continue
    const match = DEFINE_RE.exec(line)
    if (match) names.add(match[1])
  }
  return [...names]
}


export function registerRacketCompletionProvider(monaco: Monaco, terms: GlossaryTerm[]): void {
  if (registered) return
  registered = true

  const glossarySuggestions = terms.map((t) => ({
    label: t.term,
    kind: monaco.languages.CompletionItemKind.Function,
    detail: t.title,
    documentation: { value: t.md },
    insertText: t.term,
  }))

  const keywordSuggestions = KEYWORDS.map((k) => ({
    label: k,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: k,
  }))

  monaco.languages.registerCompletionItemProvider('scheme', {
    provideCompletionItems(model: MonacoEditorNS.ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const ownSuggestions = extractDefinedNames(model.getValue()).map((name) => ({
        label: name,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: 'definido en este archivo',
        insertText: name,
      }))

      return {
        suggestions: [...glossarySuggestions, ...keywordSuggestions, ...ownSuggestions].map((s) => ({ ...s, range })),
      }
    },
  })
}
