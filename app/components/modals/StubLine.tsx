'use client'

import { useState, useRef } from 'react'
import type { StubLineProps } from '@/app/types/props'

export default function StubLine({ tokenName, onFill }: Readonly<StubLineProps>) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const commit = () => {
    const trimmed = value.trim()
    if (!trimmed) { setError(false); return }
    if (!trimmed.startsWith('(')) { setError(true); return }
    setError(false)
    onFill(trimmed)
  }

  return (
    <div className="flex items-center gap-2 my-0.5">
      <span className="text-amber-500 shrink-0">; ⚠</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => { setValue(e.target.value); if (error) setError(false) }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        placeholder={`(${tokenName} (...) tipo)`}
        spellCheck={false}
        className={`flex-1 bg-[#2a2010] border rounded px-2 py-0.5 text-amber-300 placeholder-amber-900 focus:outline-none transition-colors ${
          error ? 'border-red-500' : 'border-amber-600/40 focus:border-amber-500'
        }`}
      />
      {error && (
        <span className="text-red-400 text-[11px] shrink-0">
          debe ser una regla completa, ej: ({tokenName} (...) tipo)
        </span>
      )}
    </div>
  )
}
