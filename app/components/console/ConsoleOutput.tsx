'use client'

import { useEffect, useRef } from 'react'
import type { ConsoleOutputProps } from '@/app/types/props'
import { levelStyles, levelPrefix, PROMPT } from '@/app/lib/console-format'
import { useInputHistory } from '@/app/hooks/useInputHistory'

const MAX_INPUT_HEIGHT = 120

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { record, onArrowUp, onArrowDown } = useInputHistory(inputValue, onInputChange)

  const promptVisible = sessionActive && !running && pendingSteps === 0

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, running, pendingSteps, sessionActive])

  useEffect(() => {
    if (promptVisible) textareaRef.current?.focus()
  }, [promptVisible])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }, [inputValue, promptVisible])

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const val = inputValue.trim()
    if (!val) return
    record(val)
    onSubmit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) return handleEnter(e)
    if (e.key === 'ArrowUp') return onArrowUp(e)
    if (e.key === 'ArrowDown') return onArrowDown(e)
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

      <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 overflow-auto p-2 font-mono text-xs space-y-0.5">
        {logs.map((log) => (
          <div
            key={log.id}
            data-testid="console-line"
            data-level={log.level}
            className={`flex gap-2 items-start ${levelStyles[log.level]}`}
          >
            <span className="shrink-0 text-right w-6 opacity-70 pt-px">{levelPrefix[log.level]}</span>
            <pre className="break-all whitespace-pre-wrap font-mono flex-1 min-w-0">{log.message}</pre>
          </div>
        ))}

        {!sessionActive && (
          <div className="text-zinc-400">Presiona ▶ Ejecutar para comenzar</div>
        )}

        {sessionActive && running && (
          <div className="text-zinc-500 animate-pulse pl-8">ejecutando…</div>
        )}

        {sessionActive && pendingSteps > 0 && (
          <div className="flex gap-2 items-start">
            <span className="shrink-0 text-right w-6 text-blue-400 select-none">{PROMPT}</span>
            <button
              onClick={onNextStep}
              className="flex-1 text-left text-blue-300 hover:text-blue-200 transition-colors"
            >
              ▶ Siguiente paso{' '}
              <span className="ml-2 text-[10px] text-zinc-500">({pendingSteps} restante{pendingSteps === 1 ? '' : 's'})</span>
            </button>
          </div>
        )}

        {promptVisible && (
          <label className="flex gap-2 items-start">
            <span className="shrink-0 text-right w-6 text-sky-400 select-none pt-px">{PROMPT}</span>
            <textarea
              ref={textareaRef}
              data-testid="console-input"
              aria-label="Entrada de la consola"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="expresión… (Enter ejecuta · Shift+Enter nueva línea)"
              rows={1}
              spellCheck={false}
              className="flex-1 min-w-0 resize-none bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none leading-relaxed"
            />
          </label>
        )}
      </div>
    </div>
  )
}
