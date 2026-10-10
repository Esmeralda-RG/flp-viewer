'use client'

import { useState, useCallback } from 'react'

export function useInputHistory(value: string, onChange: (v: string) => void) {
  const [history, setHistory] = useState<string[]>([])
  const [index, setIndex] = useState(-1)
  const [draft, setDraft] = useState('')

  const record = useCallback((entry: string) => {
    setHistory((prev) => (prev.at(-1) === entry ? prev : [...prev, entry]))
    setIndex(-1)
    setDraft('')
  }, [])

  const onArrowUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    if (ta.value.slice(0, ta.selectionStart ?? 0).includes('\n')) return
    if (history.length === 0) return
    e.preventDefault()
    if (index === -1) {
      setDraft(value)
      const idx = history.length - 1
      setIndex(idx)
      onChange(history[idx])
      return
    }
    if (index > 0) {
      const idx = index - 1
      setIndex(idx)
      onChange(history[idx])
    }
  }, [history, index, value, onChange])

  const onArrowDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (index === -1) return
    const ta = e.currentTarget
    if (ta.value.slice(ta.selectionStart ?? ta.value.length).includes('\n')) return
    e.preventDefault()
    if (index >= history.length - 1) {
      setIndex(-1)
      onChange(draft)
      return
    }
    const idx = index + 1
    setIndex(idx)
    onChange(history[idx])
  }, [history, index, draft, onChange])

  return { record, onArrowUp, onArrowDown }
}
