'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import type { OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import type { CodeEditorProps } from '@/app/types/props'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function CodeEditor({
  value,
  onChange,
  language = 'scheme',
  theme = 'vs-dark',
  lockedLines,
}: Readonly<CodeEditorProps>) {
  const decorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null)

  const handleMount: OnMount = (editor, monaco) => {
    const model = editor.getModel()
    if (!model) { editor.focus(); return }

    const lineMap = new Map<number, string>()
    if (lockedLines?.length) {
      for (const n of lockedLines) {
        if (n >= 1 && n <= model.getLineCount()) {
          lineMap.set(n, model.getLineContent(n))
        }
      }
    }

    const decorations = Array.from(lineMap.keys()).map((n) => ({
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
        Array.from(lineMap.keys()).map((n) => ({
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

    if (!lineMap.size) { editor.focus(); return }

    let reverting = false

    model.onDidChangeContent((event) => {
      if (reverting) return
      const changes = [...event.changes].sort(
        (a, b) => a.range.startLineNumber - b.range.startLineNumber,
      )

      const restoreOps: MonacoEditorNS.IIdentifiedSingleEditOperation[] = []

      for (const change of changes) {
        const { startLineNumber, endLineNumber } = change.range
        for (const [lockedLine, lockedContent] of lineMap) {
          if (startLineNumber <= lockedLine && endLineNumber >= lockedLine) {
            const currentLen =
              lockedLine <= model.getLineCount()
                ? model.getLineContent(lockedLine).length
                : 0
            restoreOps.push({
              range: new monaco.Range(
                lockedLine, 1,
                lockedLine, Math.max(1, currentLen + 1),
              ),
              text: lockedContent,
            })
          }
        }
      }

      if (restoreOps.length) {
        reverting = true
        model.pushEditOperations([], restoreOps, () => null)
        reverting = false
        return
      }
      const reverseChanges = [...event.changes].sort(
        (a, b) => b.range.startLineNumber - a.range.startLineNumber,
      )

      for (const change of reverseChanges) {
        const pivot = change.range.startLineNumber
        const removed = change.range.endLineNumber - change.range.startLineNumber
        const added = (change.text.match(/\n/g) || []).length
        const delta = added - removed

        if (delta !== 0) {
          const next = new Map<number, string>()
          for (const [n, content] of lineMap) {
            next.set(n > pivot ? n + delta : n, content)
          }
          lineMap.clear()
          for (const [k, v] of next) lineMap.set(k, v)
        }
      }

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
