export type LogLevel = 'info' | 'error' | 'warn' | 'output' | 'input'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: number
}
