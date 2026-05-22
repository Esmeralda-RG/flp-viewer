'use client'

import { useEffect, useRef } from 'react'

export type LogLevel = 'info' | 'error' | 'warn' | 'output' | 'input'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: number
}

const levelStyles: Record<LogLevel, string> = {
  input:  'text-sky-300',
  output: 'text-green-400',
  info:   'text-zinc-400',
  warn:   'text-amber-400',
  error:  'text-red-400',
}

const levelPrefix: Record<LogLevel, string> = {
  input:  '-->',
  output: '→',
  info:   'i',
  warn:   '⚠',
  error:  '✕',
}

interface ConsoleOutputProps {
  logs: LogEntry[]
  inputValue: string
  onInputChange: (v: string) => void
  onSubmit: () => void
  running: boolean
  onClear: () => void
}

export default function ConsoleOutput({
  logs,
  inputValue,
  onInputChange,
  onSubmit,
  running,
  onClear,
}: Readonly<ConsoleOutputProps>) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!running && inputValue.trim()) onSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Consola</span>
        <span className="ml-2 text-xs text-zinc-600">({logs.length})</span>
        <button
          onClick={onClear}
          className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
        >
          limpiar
        </button>
      </div>

      {/* Log history */}
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            Escribe una expresión abajo y presiona Enter
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log) => (
              <div key={log.id} className={`flex gap-2 items-start ${levelStyles[log.level]}`}>
                <span className="shrink-0 text-right w-6 opacity-70 pt-px">
                  {levelPrefix[log.level]}
                </span>
                <pre className="break-all whitespace-pre-wrap font-mono flex-1 min-w-0">{log.message}</pre>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* REPL input area */}
      <div className="border-t border-[#3c3c3c] bg-[#1a1a1a] flex items-start gap-2 px-3 py-2 shrink-0">
        <span className="text-sky-400 font-mono text-xs pt-[3px] shrink-0 select-none">--&gt;</span>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="expresión… (Enter ejecuta · Shift+Enter nueva línea)"
          disabled={running}
          rows={1}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none disabled:opacity-50 leading-relaxed"
        />
        {running && (
          <span className="text-[10px] text-zinc-500 pt-1 shrink-0 animate-pulse">ejecutando…</span>
        )}
      </div>
    </div>
  )
}
