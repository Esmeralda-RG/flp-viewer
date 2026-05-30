'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { HelpSection } from '@/app/types/help'

// ── Markdown styles ───────────────────────────────────────────────────────────

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-bold text-zinc-100 mb-3 mt-1 pb-2 border-b border-zinc-700/60">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-semibold text-zinc-200 mb-2 mt-5">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xs font-semibold text-zinc-300 mb-1.5 mt-4 uppercase tracking-wide">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-xs text-zinc-300 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-none mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 text-xs text-zinc-300">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
      <span className="text-zinc-600 shrink-0 mt-0.5">›</span>
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <code className="block font-mono text-[11px] text-emerald-300 leading-relaxed whitespace-pre">
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-[11px] bg-zinc-800 text-amber-300 px-1 py-px rounded border border-zinc-700/60">
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-[#1a1a1a] border border-zinc-700/50 rounded-lg p-3 mb-3 overflow-x-auto">
      {children}
    </pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-blue-500/60 pl-3 mb-3 text-xs text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-zinc-300 not-italic font-medium">{children}</em>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4 rounded-lg border border-zinc-700/60">
      <table className="w-full text-[11px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-zinc-800/80">{children}</thead>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-zinc-700/50 even:bg-zinc-800/30 last:border-0">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold text-zinc-300 text-[11px] border-b border-zinc-600/60">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-zinc-300 font-mono text-[11px]">{children}</td>
  ),
  hr: () => <hr className="border-zinc-700/50 my-4" />,
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface HelpDrawerProps {
  open: boolean
  onClose: () => void
  sections: HelpSection[]
}

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

  // Reset search when drawer closes
  useEffect(() => { if (!open) setQuery('') }, [open])

  const q = query.trim().toLowerCase()

  // Auto-select first result when search query changes
  useEffect(() => {
    if (!q) return
    const matches = sections.filter(s =>
      s.title.toLowerCase().includes(q) || s.md.toLowerCase().includes(q)
    )
    if (matches.length > 0 && !matches.some(s => s.id === activeId)) {
      setActiveId(matches[0].id)
    }
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible && !open) return null

  const filtered = q
    ? sections.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.md.toLowerCase().includes(q)
      )
    : sections

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
              <p className="px-3 py-4 text-[11px] text-zinc-600 text-center">Sin resultados</p>
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

           
          <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0">
            {active ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {active.md.trim()}
              </ReactMarkdown>
            ) : (
              <p className="text-xs text-zinc-600 mt-8 text-center">No hay contenido que coincida.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
