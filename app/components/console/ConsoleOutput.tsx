'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConsoleOutputProps } from '@/app/types/props'
import { levelStyles, levelPrefix } from '@/app/lib/console-format'

export default function ConsoleOutput({
  logs,
  inputValue,
  onInputChange,
  onSubmit,
  running,
  sessionActive,
  onClear,
  pendingSteps,
  onNextStep,
}: Readonly<ConsoleOutputProps>) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prevSession, setPrevSession] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (sessionActive && !prevSession) {
      textareaRef.current?.focus()
    }
    setPrevSession(sessionActive)
  }, [sessionActive, prevSession])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (sessionActive && !running && inputValue.trim()) {
        const val = inputValue.trim()
        setHistory(prev => prev.at(-1) === val ? prev : [...prev, val])
        setHistoryIndex(-1)
        setDraft('')
        onSubmit()
      }
      return
    }

    if (e.key === 'ArrowUp') {
      const ta = e.currentTarget
      if (ta.value.slice(0, ta.selectionStart ?? 0).includes('\n')) return
      if (history.length === 0) return
      e.preventDefault()
      if (historyIndex === -1) {
        setDraft(inputValue)
        const idx = history.length - 1
        setHistoryIndex(idx)
        onInputChange(history[idx])
      } else if (historyIndex > 0) {
        const idx = historyIndex - 1
        setHistoryIndex(idx)
        onInputChange(history[idx])
      }
      return
    }

    if (e.key === 'ArrowDown') {
      if (historyIndex === -1) return
      const ta = e.currentTarget
      if (ta.value.slice(ta.selectionStart ?? ta.value.length).includes('\n')) return
      e.preventDefault()
      if (historyIndex >= history.length - 1) {
        setHistoryIndex(-1)
        onInputChange(draft)
      } else {
        const idx = historyIndex + 1
        setHistoryIndex(idx)
        onInputChange(history[idx])
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Consola</span>
        <span className="ml-2 text-xs text-zinc-400">({logs.length})</span>
        <button
          onClick={onClear}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
        >
          limpiar
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400">
            {sessionActive ? 'Escribe una expresión y presiona Enter' : 'Presiona ▶ Ejecutar para comenzar'}
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

      <div className="border-t border-[#3c3c3c] bg-[#1a1a1a] flex items-start gap-2 px-3 py-2 shrink-0">
        {pendingSteps > 0 ? (
          <>
            <span className="font-mono text-xs pt-0.75 shrink-0 text-blue-400 select-none">--&gt;</span>
            <button
              onClick={onNextStep}
              className="flex-1 text-left text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
              ▶ Siguiente paso{' '}
              <span className="ml-2 text-[10px] text-zinc-500">({pendingSteps} restante{pendingSteps === 1 ? '' : 's'})</span>
            </button>
          </>
        ) : (
          <>
            <span className={`font-mono text-xs pt-0.75 shrink-0 select-none ${sessionActive ? 'text-sky-400' : 'text-zinc-400'}`}>
              --&gt;
            </span>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sessionActive ? 'expresión… (Enter ejecuta · Shift+Enter nueva línea)' : 'Presiona ▶ Ejecutar para activar'}
              disabled={!sessionActive || running}
              rows={1}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none disabled:opacity-50 leading-relaxed"
            />
            {running && (
              <span className="text-[10px] text-zinc-500 pt-1 shrink-0 animate-pulse">ejecutando…</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
