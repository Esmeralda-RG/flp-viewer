import type { LogLevel } from '@/app/types/console'

export function classifyStepOutput(output: string | null): { message: string; level: LogLevel } {
  if (output === null || output === '"void"' || output === 'null') {
    return { message: 'void', level: 'info' }
  }
  if (output.startsWith('"✕ ') && output.endsWith('"')) {
    return { message: output.slice(3, -1), level: 'error' }
  }
  return { message: output, level: 'output' }
}
