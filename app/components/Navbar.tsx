'use client'

import { useRef, useState, useEffect } from 'react'
import type { Example } from '@/app/types/examples'

interface NavbarProps {
  examples: Example[]
  onExampleSelect: (example: Example) => void
  onGrammarOpen: () => void
  onDownload: () => void
  onRun: () => void
  onStop: () => void
  onClear: () => void
  onHelpOpen: () => void
  running: boolean
  stepMode: boolean
  onStepModeToggle: () => void
}

export default function Navbar({
  examples,
  onExampleSelect,
  onGrammarOpen,
  onDownload,
  onRun,
  onStop,
  onClear,
  onHelpOpen,
  running,
  stepMode,
  onStepModeToggle,
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
       
      <span className="text-sm font-semibold text-zinc-200 mr-2">FLP Viewer</span>
      <span className="text-zinc-400 text-xs hidden sm:block">Intérprete Educativo</span>

      <div className="w-px h-4 bg-[#3c3c3c] mx-2" />

       
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
            {examples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { onExampleSelect(ex); setDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors"
              >
                <div className="text-xs font-medium text-zinc-200">{ex.label}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{ex.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

       
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

       
      <button
        onClick={onStepModeToggle}
        title="Paso a paso"
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors ${
          stepMode
            ? 'bg-blue-600/30 border border-blue-500/50 text-blue-300'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M3 4h10M3 8h6M3 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 10l3 2-3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Paso a paso
      </button>

       
      <div className="flex-1" />

       
      <button
        onClick={onHelpOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Ayuda"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6.5 6.2C6.5 5.3 7.1 4.7 8 4.7s1.5.6 1.5 1.5c0 .8-.5 1.2-1 1.5C8 8 7.8 8.3 7.8 8.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11" r=".7" fill="currentColor" />
        </svg>
        Ayuda
      </button>

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
