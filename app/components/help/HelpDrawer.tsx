'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { HelpDrawerProps } from '@/app/types/props'
import { filterSections } from '@/app/lib/help-search'
import { mdComponents } from './MarkdownComponents'

export default function HelpDrawer({ open, onClose, sections }: Readonly<HelpDrawerProps>) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 280)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => { if (!open) setQuery('') }, [open])

  useEffect(() => {
    if (!query.trim()) return
    const matches = filterSections(sections, query)
    if (matches.length > 0 && !matches.some(s => s.id === activeId)) {
      setActiveId(matches[0].id)
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible && !open) return null

  const filtered = filterSections(sections, query)
  const active = filtered.find(s => s.id === activeId) ?? filtered[0] ?? null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-280"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onClose}
        aria-label="Cerrar ayuda"
      />

      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#1e1e1e] border-l border-[#3c3c3c] shadow-2xl"
        style={{
          width: 'min(700px, 90vw)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
          <span className="text-sm font-semibold text-zinc-200">Ayuda — EOPL / FLP Viewer</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            aria-label="Cerrar ayuda"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-3 py-2 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
          <div className="flex items-center gap-2 bg-[#3c3c3c] rounded px-2.5 py-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 16 16">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en la ayuda…"
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <nav className="w-44 shrink-0 flex flex-col py-2 bg-[#1e1e1e] border-r border-[#3c3c3c] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-[11px] text-zinc-400 text-center">Sin resultados</p>
            ) : (
              filtered.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={[
                    'flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
                    activeId === s.id
                      ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
                  ].join(' ')}
                >
                  <span className="text-sm">{s.icon}</span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))
            )}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0" tabIndex={0}>
            {active ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {active.md.trim()}
              </ReactMarkdown>
            ) : (
              <p className="text-xs text-zinc-400 mt-8 text-center">No hay contenido que coincida.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
