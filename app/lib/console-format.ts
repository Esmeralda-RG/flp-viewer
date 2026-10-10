import type { LogLevel } from '@/app/types/console'

export const PROMPT = '-->'

export const levelStyles: Record<LogLevel, string> = {
  input:  'text-sky-300',
  output: 'text-green-400',
  info:   'text-zinc-400',
  warn:   'text-amber-400',
  error:  'text-red-400',
}

export const levelPrefix: Record<LogLevel, string> = {
  input:  PROMPT,
  output: '→',
  info:   'i',
  warn:   '⚠',
  error:  '✕',
}
