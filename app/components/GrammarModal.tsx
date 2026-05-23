'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { runPipeline } from '@/app/lib/grammar-pipeline'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: 'var(--font-geist-mono), Menlo, Monaco, monospace',
  lineNumbers: 'on' as const,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 10 },
}

const DEFAULT_BNF = `; ── Tokens disponibles ──────────────────────────────────────
; number  float  identifier  binary  octal  hex  text
; (whitespace y comment siempre se incluyen automáticamente)
; Omite esta sección para incluir todos los tokens del curso.
%lex number
%lex identifier

; ── Gramática ────────────────────────────────────────────────
<program> ::= <expr>

<expr> ::= <number>                              => lit-exp
         | <identifier>                          => var-exp
         | "(" <expr> "+" <expr> ")"             => add-exp
         | "let" <identifier> "=" <expr>
             "in" <expr>                         => let-exp
         | "if" <expr> "then" <expr>
             "else" <expr>                       => if-exp
         | "proc" "(" <identifier> ")" <expr>    => proc-exp
         | "(" <expr> <expr> ")"                 => call-exp
`

export interface GeneratedGrammarFiles {
  input: string
  grammarRkt: string
  environmentRkt: string
  mainRkt: string
  mainLockedLines: number[]
}

interface GrammarModalProps {
  onClose: () => void
  onGenerate: (files: GeneratedGrammarFiles) => void
}

export default function GrammarModal({ onClose, onGenerate }: Readonly<GrammarModalProps>) {
  const [input, setInput] = useState(DEFAULT_BNF)
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [valid, setValid] = useState(false)

  // Debounced pipeline execution for live preview
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = runPipeline(input)
      setPreview(result.grammarRkt)
      setErrors(result.errors)
      setValid(result.errors.length === 0 && result.grammarRkt.length > 0)
    }, 350)
    return () => clearTimeout(timer)
  }, [input])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleGenerate = () => {
    const result = runPipeline(input)
    if (result.errors.length > 0 || !result.grammarRkt) return
    onGenerate({
      input,
      grammarRkt: result.grammarRkt,
      environmentRkt: result.environmentRkt,
      mainRkt: result.mainRkt,
      mainLockedLines: result.mainLockedLines,
    })
  }

  const lineCount = preview.split('\n').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex flex-col w-[92vw] h-[84vh] max-w-7xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
          <span className="text-sm font-semibold text-zinc-200">Generador BNF → EOPL/SLLGEN</span>
          <span className="text-xs text-zinc-500">Escribe tu gramática y genera los archivos Racket automáticamente</span>
          <button
            onClick={onClose}
            className="ml-auto text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Editors */}
        <div className="flex flex-1 min-h-0">
          {/* BNF Input */}
          <div className="flex flex-col w-1/2 border-r border-[#3c3c3c]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Entrada BNF/EBNF</span>
              <span className="text-[10px] text-zinc-600 ml-auto">
                Soporta: &lt;nt&gt;, "terminal", |, *, +, ?, ()*, =&gt; nombre
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="plaintext"
                theme="vs-dark"
                value={input}
                onChange={(v) => setInput(v ?? '')}
                options={EDITOR_OPTIONS}
              />
            </div>
          </div>

          {/* EOPL Preview */}
          <div className="flex flex-col w-1/2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                grammar.rkt — previsualización
              </span>
              {valid && (
                <span className="ml-auto text-[10px] text-green-500">{lineCount} líneas</span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="scheme"
                theme="vs-dark"
                value={valid ? preview : ''}
                options={{ ...EDITOR_OPTIONS, readOnly: true }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252526] border-t border-[#3c3c3c] shrink-0">
          {errors.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono flex-1 min-w-0">
              <span className="shrink-0">✕</span>
              <span className="truncate">{errors[0]}</span>
            </div>
          ) : valid ? (
            <div className="text-xs text-green-400 flex-1">
              ✓ Gramática válida — se generarán: main.rkt, grammar.rkt, environment.rkt, grammar-input.bnf
            </div>
          ) : (
            <div className="flex-1 text-xs text-zinc-600">Escribe una gramática BNF para ver la previsualización</div>
          )}

          <button
            onClick={onClose}
            className="shrink-0 text-xs px-3 py-1.5 rounded border border-[#555] text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!valid}
            className="shrink-0 text-xs px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            Generar archivos
          </button>
        </div>
      </div>
    </div>
  )
}
