'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { runPipeline } from '@/app/lib/grammar-pipeline'

const STUB_RE = /^(\s*); ⚠ "(.+?)" — falta implementar/

function GrammarPreview({
  content,
  onStubFill,
}: Readonly<{ content: string; onStubFill: (tokenName: string, rule: string) => void }>) {
  const lines = content.split('\n')

  return (
    <div className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed">
      {lines.map((line, i) => {
        const m = new RegExp(STUB_RE).exec(line)
        if (m) {
          const tokenName = m[2]
          return (
            <StubLine
              key={`${tokenName}-${line.trim()}`}
              tokenName={tokenName}
              onFill={(rule) => onStubFill(tokenName, rule)}
            />
          )
        }
        return (
          <div key={`line-${i}-${line}`} className="whitespace-pre">
            <SchemeLine text={line} />
          </div>
        )
      })}
    </div>
  )
}

function StubLine({ tokenName, onFill }: Readonly<{ tokenName: string; onFill: (rule: string) => void }>) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed) onFill(trimmed)
  }

  return (
    <div className="flex items-center gap-2 my-0.5">
      <span className="text-amber-500 shrink-0">; ⚠</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        placeholder={`(${tokenName} (...) tipo)`}
        spellCheck={false}
        className="flex-1 bg-[#2a2010] border border-amber-600/40 rounded px-2 py-0.5 text-amber-300 placeholder-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  )
}

const SCHEME_COLORS: [RegExp, string][] = [
  [/^(#lang\s+\S+)/, 'text-green-400'],
  [/^(;;;.*|;;.*)/, 'text-zinc-600'],
  [/^(\s*;.*)/, 'text-zinc-500'],
  [/^(\s*\(define\b)/, 'text-blue-400'],
  [/^(\s*\(provide\b)/, 'text-purple-400'],
]

function SchemeLine({ text }: Readonly<{ text: string }>) {
  for (const [re, cls] of SCHEME_COLORS) {
    if (re.test(text)) return <span className={cls}>{text}</span>
  }
  return <span className="text-zinc-300">{text}</span>
}

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

const DEFAULT_LEX = `; Tokens disponibles: number  float  identifier  binary  octal  hex  text
; whitespace y comment siempre se incluyen automáticamente
; Deja vacío para incluir todos los tokens del curso
number
identifier
`

const DEFAULT_GRAMMAR = `<program> ::= <expr>

<expr> ::= <number>                                    => lit-exp
         | <identifier>                                => var-exp
         | "-" "(" <expr> "," <expr> ")"              => diff-exp
         | "zero?" "(" <expr> ")"                     => zero?-exp
         | "if" <expr> "then" <expr> "else" <expr>    => if-exp
         | "let" <identifier> "=" <expr> "in" <expr>  => let-exp
         | "proc" "(" <identifier> ")" <expr>         => proc-exp
         | "(" <expr> <expr> ")"                      => call-exp
`

import type { GeneratedGrammarFiles } from '@/app/types/editor'
export type { GeneratedGrammarFiles }

interface GrammarModalProps {
  onClose: () => void
  onGenerate: (files: GeneratedGrammarFiles) => void
}

export default function GrammarModal({ onClose, onGenerate }: Readonly<GrammarModalProps>) {
  const [lexInput, setLexInput]         = useState(DEFAULT_LEX)
  const [grammarInput, setGrammarInput] = useState(DEFAULT_GRAMMAR)
  const [preview, setPreview]           = useState('')
  const [errors, setErrors]             = useState<string[]>([])
  const [hasGrammar, setHasGrammar]     = useState(false)
  const [canGenerate, setCanGenerate]   = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = runPipeline(lexInput, grammarInput)
      setPreview(result.grammarRkt)
      setErrors(result.errors)
      setHasGrammar(result.grammarRkt.length > 0)
      setCanGenerate(result.errors.length === 0 && result.grammarRkt.length > 0)
    }, 350)
    return () => clearTimeout(timer)
  }, [lexInput, grammarInput])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    globalThis.addEventListener('keydown', handler)
    return () => globalThis.removeEventListener('keydown', handler)
  }, [onClose])

  const handleStubFill = (tokenName: string, rule: string) => {
    setLexInput((prev) =>
      prev
        .split('\n')
        .map((line) => (line.trim() === tokenName ? rule : line))
        .join('\n')
    )
  }

  const handleGenerate = () => {
    const result = runPipeline(lexInput, grammarInput)
    if (!canGenerate || !result.grammarRkt) return
    onGenerate({
      input: `; === Especificación Léxica ===\n${lexInput}\n; === Gramática ===\n${grammarInput}`,
      grammarRkt: result.grammarRkt,
      environmentRkt: result.environmentRkt,
      mainRkt: result.mainRkt,
      mainLockedLines: result.mainLockedLines,
    })
  }

  const lineCount = preview.split('\n').length
  let statusMessage: React.ReactNode

  if (errors.length > 0) {
    statusMessage = (
      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono flex-1 min-w-0">
        <span className="shrink-0">⚠</span>
        <span className="truncate">{errors[0]}</span>
      </div>
    )
  } else if (canGenerate) {
    statusMessage = (
      <div className="text-xs text-green-400 flex-1">
        ✓ Listo — se generarán: main.rkt, grammar.rkt, environment.rkt, grammar-input.bnf
      </div>
    )
  } else {
    statusMessage = (
      <div className="flex-1 text-xs text-zinc-600">Escribe una gramática BNF para ver la previsualización</div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
       
      <button
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        type="button"
        tabIndex={0}
        aria-label="Close modal"
      />

       
      <div className="relative z-10 flex flex-col w-[92vw] h-[84vh] max-w-7xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden">

         
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

         
        <div className="flex flex-1 min-h-0">
           
          <div className="flex flex-col w-1/2 border-r border-[#3c3c3c]">

             
            <div className="flex flex-col border-b border-[#3c3c3c]" style={{ height: '28%' }}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Especificación Léxica</span>
                <span className="text-[10px] text-zinc-600 ml-auto">un token por línea</span>
              </div>
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  language="plaintext"
                  theme="vs-dark"
                  value={lexInput}
                  onChange={(v) => setLexInput(v ?? '')}
                  options={EDITOR_OPTIONS}
                />
              </div>
            </div>

             
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Gramática BNF</span>
                <span className="text-[10px] text-zinc-600 ml-auto">
                  &lt;nt&gt; ::= items | alt &nbsp;·&nbsp; =&gt; nombre
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <MonacoEditor
                  height="100%"
                  language="plaintext"
                  theme="vs-dark"
                  value={grammarInput}
                  onChange={(v) => setGrammarInput(v ?? '')}
                  options={EDITOR_OPTIONS}
                />
              </div>
            </div>

          </div>

           
          <div className="flex flex-col w-1/2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                grammar.rkt — previsualización
              </span>
              {hasGrammar && (
                <span className={`ml-auto text-[10px] ${canGenerate ? 'text-green-500' : 'text-amber-400'}`}>
                  {lineCount} líneas{canGenerate ? '' : ' · pendiente'}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-hidden bg-[#1e1e1e]">
              {hasGrammar
                ? <GrammarPreview content={preview} onStubFill={handleStubFill} />
                : <div className="flex items-center justify-center h-full text-xs text-zinc-600">Escribe una gramática para ver la previsualización</div>
              }
            </div>
          </div>
        </div>

         
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252526] border-t border-[#3c3c3c] shrink-0">
          {statusMessage}

          <button
            onClick={onClose}
            className="shrink-0 text-xs px-3 py-1.5 rounded border border-[#555] text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="shrink-0 text-xs px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            Generar archivos
          </button>
        </div>
      </div>
    </div>
  )
}
