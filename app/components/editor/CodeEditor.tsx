'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import type { OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import type { CodeEditorProps } from '@/app/types/props'
import { registerGlossaryHoverProvider } from '@/app/lib/glossary-hover'
import { registerRacketCompletionProvider } from '@/app/lib/racket-completion'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

type ContentChanges = MonacoEditorNS.IModelContentChangedEvent['changes']

// Si una edición pisa una o más líneas bloqueadas no se reconstruye el
// contenido a mano (eso asume que la línea sigue existiendo en la misma
// posición tras la edición, lo cual se rompe con cualquier edición masiva
// — p. ej. seleccionar todo y cortar — dejando el bloque en una posición
// que ya no existe). En su lugar se deshace la edición completa con
// model.undo(): es correcto para cualquier forma de edición y de paso no
// ensucia la pila de undo con una operación sintética extra.
function changesTouchLockedLines(changes: ContentChanges, lockedLines: Set<number>): boolean {
  return changes.some((change) => {
    const { startLineNumber, endLineNumber } = change.range
    for (const lockedLine of lockedLines) {
      if (startLineNumber <= lockedLine && lockedLine <= endLineNumber) return true
    }
    return false
  })
}

// Cuando una edición inserta/borra líneas por encima de una línea bloqueada,
// su número de línea cambia — hay que re-mapear lockedLines al nuevo desplazamiento.
function shiftLockedLines(lockedLines: Set<number>, changes: ContentChanges): void {
  const reverseChanges = [...changes].sort((a, b) => b.range.startLineNumber - a.range.startLineNumber)

  for (const change of reverseChanges) {
    const pivot = change.range.startLineNumber
    const removed = change.range.endLineNumber - change.range.startLineNumber
    const added = (change.text.match(/\n/g) || []).length
    const delta = added - removed
    if (delta === 0) continue

    const next = new Set<number>()
    for (const n of lockedLines) next.add(n > pivot ? n + delta : n)
    lockedLines.clear()
    for (const n of next) lockedLines.add(n)
  }
}

export default function CodeEditor({
  value,
  onChange,
  language = 'scheme',
  theme = 'vs-dark',
  lockedLines,
  glossaryTerms,
}: Readonly<CodeEditorProps>) {
  const decorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null)

  const handleMount: OnMount = (editor, monaco) => {
    registerGlossaryHoverProvider(monaco, glossaryTerms)
    registerRacketCompletionProvider(monaco, glossaryTerms)

    const model = editor.getModel()
    if (!model) { editor.focus(); return }

    const lockedLineSet = new Set<number>()
    if (lockedLines?.length) {
      for (const n of lockedLines) {
        if (n >= 1 && n <= model.getLineCount()) lockedLineSet.add(n)
      }
    }

    const decorations = Array.from(lockedLineSet).map((n) => ({
      range: new monaco.Range(n, 1, n, 1),
      options: {
        isWholeLine: true,
        className: 'locked-line',
        linesDecorationsClassName: 'locked-line-glyph',
        hoverMessage: { value: '🔒 Esta línea no puede modificarse' },
      },
    }))

    decorationsRef.current ??= editor.createDecorationsCollection(decorations)

    const applyDecorations = () => {
      decorationsRef.current!.set(
        Array.from(lockedLineSet).map((n) => ({
          range: new monaco.Range(n, 1, n, 1),
          options: {
            isWholeLine: true,
            className: 'locked-line',
            linesDecorationsClassName: 'locked-line-glyph',
            hoverMessage: { value: '🔒 Esta línea no puede modificarse' },
          },
        })),
      )
    }

    applyDecorations()

    if (!lockedLineSet.size) { editor.focus(); return }

    let reverting = false

    model.onDidChangeContent((event) => {
      if (reverting) return

      if (changesTouchLockedLines(event.changes, lockedLineSet)) {
        reverting = true
        model.undo()
        reverting = false
        // El onChange nativo de Monaco ya disparó con el contenido sin deshacer
        // (se registra antes que este listener) — resincroniza React con el
        // valor correcto del modelo, o la próxima vez que el `value` controlado
        // se reaplique, reintroduce la edición que acabamos de deshacer.
        onChange(model.getValue())
        // Las decoraciones "locked-line" siguen su rango a través de la edición
        // (isWholeLine) — si el undo reinsertó todo el texto borrado dentro de
        // ese rango, la decoración se expande para cubrirlo entero. Recalcularlas
        // desde lockedLineSet (ya válido: el documento volvió a su estado previo)
        // en vez de confiar en el tracking automático de Monaco.
        applyDecorations()
        return
      }

      shiftLockedLines(lockedLineSet, event.changes)
      applyDecorations()
    })

    editor.focus()
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme={theme}
          value={value}
          onChange={(val) => onChange(val ?? '')}
          onMount={handleMount}
          options={{
            fontSize: 14,
            fontFamily: 'var(--font-geist-mono), Menlo, Monaco, monospace',
            lineNumbers: 'on',
            minimap: { enabled: true },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  )
}
