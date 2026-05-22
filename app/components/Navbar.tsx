'use client'

import { useRef, useState, useEffect } from 'react'
import {
  TEMPLATE_MAIN,
  TEMPLATE_GRAMMAR,
  TEMPLATE_ENVIRONMENT,
  TEMPLATE_UTILS,
} from '@/app/data/template-files'

export interface ExampleFile {
  id: string
  name: string
  content: string
  language: string
  lockedLines?: number[]
}

export interface Example {
  id: string
  label: string
  description: string
  code: string
  lockedLines?: number[]
  files?: ExampleFile[]
  activeFileId?: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'eopl-template',
    label: 'EOPL Interpreter',
    description: 'Intérprete completo — gramática, ambiente y evaluación',
    code: TEMPLATE_MAIN,
    files: [
      { id: 'main',           name: 'main.rkt',        content: TEMPLATE_MAIN,        language: 'scheme' },
      { id: 'grammar-rkt',    name: 'grammar.rkt',      content: TEMPLATE_GRAMMAR,     language: 'scheme' },
      { id: 'environment-rkt',name: 'environment.rkt',  content: TEMPLATE_ENVIRONMENT, language: 'scheme' },
      { id: 'utils',          name: 'utils.rkt',        content: TEMPLATE_UTILS,       language: 'scheme' },
    ],
    activeFileId: 'main',
  },
]

interface NavbarProps {
  onExampleSelect: (example: Example) => void
  onGrammarOpen: () => void
  onDownload: () => void
  onRun: () => void
  onStop: () => void
  onClear: () => void
  running: boolean
}

export default function Navbar({
  onExampleSelect,
  onGrammarOpen,
  onDownload,
  onRun,
  onStop,
  onClear,
  running,
}: Readonly<NavbarProps>) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="flex items-center gap-1 px-3 py-1.5 bg-[#323233] border-b border-[#3c3c3c] shrink-0 h-10">
      {/* Brand */}
      <span className="text-sm font-semibold text-zinc-200 mr-2">FLP Viewer</span>
      <span className="text-zinc-700 text-xs hidden sm:block">Intérprete Educativo</span>

      <div className="w-px h-4 bg-[#3c3c3c] mx-2" />

      {/* Examples dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          Ejemplos
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 12 12">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-[#2d2d2d] border border-[#3c3c3c] rounded shadow-xl z-50 py-1">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { onExampleSelect(ex); setDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <div className="text-xs font-medium text-zinc-200">{ex.label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{ex.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grammar generator */}
      <button
        onClick={onGrammarOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        title="Abrir generador BNF → EOPL"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M8 2v8M5 5l3-3 3 3M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Gramática
      </button>

      {/* Download */}
      <button
        onClick={onDownload}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
        title="Descargar código fuente"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M8 2v8M5 11l3 3 3-3M3 13v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Descargar
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onClear}
        className="text-xs px-3 py-1 rounded border border-[#555] text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors"
      >
        Limpiar
      </button>
      {running ? (
        <button
          onClick={onStop}
          className="text-xs px-4 py-1 rounded bg-red-700 hover:bg-red-600 text-white font-medium transition-colors"
        >
          ■ Detener
        </button>
      ) : (
        <button
          onClick={onRun}
          className="text-xs px-4 py-1 rounded bg-green-700 hover:bg-green-600 text-white font-medium transition-colors"
        >
          ▶ Ejecutar
        </button>
      )}
    </header>
  )
}
