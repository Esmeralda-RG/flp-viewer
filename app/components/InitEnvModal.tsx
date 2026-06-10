'use client'

import { useState } from 'react'
import { type InitBinding, inferType } from '@/app/lib/init-env-utils'

const TYPE_COLORS: Record<string, string> = {
  number:  'text-blue-300 bg-blue-900/20 border-blue-800/40',
  string:  'text-green-300 bg-green-900/20 border-green-800/40',
  boolean: 'text-yellow-300 bg-yellow-900/20 border-yellow-800/40',
  symbol:  'text-purple-300 bg-purple-900/20 border-purple-800/40',
  list:    'text-cyan-300 bg-cyan-900/20 border-cyan-800/40',
  value:   'text-zinc-400 bg-zinc-800/20 border-zinc-700/40',
}

interface Row extends InitBinding { id: string }

interface InitEnvModalProps {
  bindings: InitBinding[]
  onClose: () => void
  onApply: (bindings: InitBinding[]) => void
}

export default function InitEnvModal({ bindings: initial, onClose, onApply }: Readonly<InitEnvModalProps>) {
  const [rows, setRows] = useState<Row[]>(
    initial.map((b, i) => ({ ...b, id: String(i) }))
  )

  const addRow = () =>
    setRows(prev => [...prev, { id: crypto.randomUUID(), name: '', value: '' }])

  const removeRow = (id: string) =>
    setRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: string, field: 'name' | 'value', val: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))

  const names = rows.map(r => r.name.trim()).filter(Boolean)
  const hasDupes = new Set(names).size !== names.length

  const handleApply = () => {
    if (hasDupes) return
    onApply(
      rows
        .filter(r => r.name.trim() && r.value.trim())
        .map(({ name, value }) => ({ name: name.trim(), value: value.trim() }))
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      <div className="relative bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">

         
        <div className="flex items-center gap-2 px-4 py-3 bg-[#252526] border-b border-[#3c3c3c]">
          <span className="text-sm font-semibold text-zinc-200">Ambiente Inicial</span>
          <span className="text-xs text-zinc-500">Variables disponibles al iniciar el intérprete</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

         
        <div className="px-4 py-4 space-y-2 max-h-72 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              Sin variables — el intérprete arranca con ambiente vacío
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_1fr_4rem_1.5rem] gap-2 text-[10px] text-zinc-400 uppercase tracking-wide mb-1 px-1">
                <span>Nombre</span><span>Valor</span><span>Tipo</span><span />
              </div>
              {rows.map(row => {
                const type = row.value.trim() ? inferType(row.value.trim()) : 'value'
                const isDupe = row.name.trim() && names.filter(n => n === row.name.trim()).length > 1
                return (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_4rem_1.5rem] gap-2 items-center">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      placeholder="x"
                      spellCheck={false}
                      className={`bg-[#2d2d2d] border rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none font-mono transition-colors ${
                        isDupe ? 'border-red-600' : 'border-[#3c3c3c] focus:border-zinc-500'
                      }`}
                    />
                    <input
                      value={row.value}
                      onChange={e => updateRow(row.id, 'value', e.target.value)}
                      placeholder="0"
                      spellCheck={false}
                      className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                    />
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono text-center ${TYPE_COLORS[type]}`}>
                      {type}
                    </span>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </>
          )}
        </div>

         
        <div className="px-4 pb-3">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Agregar variable
          </button>
        </div>

         
        <div className="px-4 pb-2 text-[10px] text-zinc-400 font-mono">
          Tipos: <span className="text-blue-400">1</span> número ·{' '}
          <span className="text-green-400">&quot;texto&quot;</span> cadena ·{' '}
          <span className="text-yellow-400">#t #f</span> booleano ·{' '}
          <span className="text-purple-400">&apos;x</span> símbolo ·{' '}
          <span className="text-cyan-400">&apos;(1 2)</span> lista
        </div>

         
        <div className="flex items-center gap-3 px-4 py-3 bg-[#252526] border-t border-[#3c3c3c]">
          {hasDupes
            ? <span className="text-xs text-amber-400 flex-1">⚠ Nombres duplicados</span>
            : <span className="flex-1" />
          }
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-[#555] text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={hasDupes}
            className="text-xs px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
