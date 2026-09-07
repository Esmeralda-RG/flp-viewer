'use client'

import { useState, useCallback } from 'react'
import type { LogEntry } from '@/app/types/console'

export function useConsoleLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'output') => {
    setLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), level, message, timestamp: Date.now() },
    ])
  }, [])

  const clearLog = useCallback(() => setLogs([]), [])

  return { logs, addLog, clearLog }
}
