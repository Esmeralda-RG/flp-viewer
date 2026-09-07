import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import ConsoleOutput from '../console/ConsoleOutput'
import type { LogEntry } from '@/app/types/console'

let _id = 0
function makeLog(level: LogEntry['level'], message: string): LogEntry {
  return {
  id: String(++_id), level, message,
  timestamp: 0
}
}

function makeProps(overrides = {}) {
  return {
    logs: [],
    inputValue: '',
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
    running: false,
    sessionActive: false,
    onClear: vi.fn(),
    pendingSteps: 0,
    onNextStep: vi.fn(),
    ...overrides,
  }
}

describe('ConsoleOutput', () => {
  describe('empty state', () => {
    it('shows inactive prompt message when session is not active', () => {
      render(<ConsoleOutput {...makeProps()} />)
      expect(screen.getByText('Presiona ▶ Ejecutar para comenzar')).toBeInTheDocument()
    })

    it('shows active prompt message when session is active', () => {
      render(<ConsoleOutput {...makeProps({ sessionActive: true })} />)
      expect(screen.getByText('Escribe una expresión y presiona Enter')).toBeInTheDocument()
    })
  })

  describe('log rendering', () => {
    it('renders log messages', () => {
      const logs = [makeLog('output', 'resultado')]
      render(<ConsoleOutput {...makeProps({ logs })} />)
      expect(screen.getByText('resultado')).toBeInTheDocument()
    })

    it('shows log count in header', () => {
      const logs = [makeLog('output', 'a'), makeLog('error', 'b')]
      render(<ConsoleOutput {...makeProps({ logs })} />)
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })

    it('renders error logs', () => {
      const logs = [makeLog('error', 'algo salió mal')]
      render(<ConsoleOutput {...makeProps({ logs })} />)
      expect(screen.getByText('algo salió mal')).toBeInTheDocument()
    })

    it('renders multiple logs in order', () => {
      const logs = [makeLog('input', 'primero'), makeLog('output', 'segundo')]
      render(<ConsoleOutput {...makeProps({ logs })} />)
      expect(screen.getByText('primero')).toBeInTheDocument()
      expect(screen.getByText('segundo')).toBeInTheDocument()
    })
  })

  describe('toolbar', () => {
    it('calls onClear when clicking limpiar', async () => {
      const onClear = vi.fn()
      render(<ConsoleOutput {...makeProps({ onClear })} />)
      await userEvent.click(screen.getByRole('button', { name: 'limpiar' }))
      expect(onClear).toHaveBeenCalledOnce()
    })
  })

  describe('input area', () => {
    it('textarea is disabled when session is not active', () => {
      render(<ConsoleOutput {...makeProps({ sessionActive: false })} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('textarea is enabled when session is active', () => {
      render(<ConsoleOutput {...makeProps({ sessionActive: true })} />)
      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })

    it('textarea is disabled when running', () => {
      render(<ConsoleOutput {...makeProps({ sessionActive: true, running: true })} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('calls onInputChange as user types', async () => {
      const onInputChange = vi.fn()
      render(<ConsoleOutput {...makeProps({ sessionActive: true, onInputChange })} />)
      await userEvent.type(screen.getByRole('textbox'), 'hola')
      expect(onInputChange).toHaveBeenCalled()
    })

    it('calls onSubmit when Enter is pressed with content', async () => {
      const onSubmit = vi.fn()
      render(<ConsoleOutput {...makeProps({ sessionActive: true, inputValue: 'test', onSubmit })} />)
      await userEvent.type(screen.getByRole('textbox'), '{Enter}')
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('does not call onSubmit when session is inactive', async () => {
      const onSubmit = vi.fn()
      render(<ConsoleOutput {...makeProps({ sessionActive: false, inputValue: 'test', onSubmit })} />)
      await userEvent.type(screen.getByRole('textbox'), '{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows running indicator when running', () => {
      render(<ConsoleOutput {...makeProps({ sessionActive: true, running: true })} />)
      expect(screen.getByText('ejecutando…')).toBeInTheDocument()
    })
  })

  describe('step mode', () => {
    it('shows step button when pendingSteps > 0', () => {
      render(<ConsoleOutput {...makeProps({ pendingSteps: 3 })} />)
      expect(screen.getByRole('button', { name: /Siguiente paso/ })).toBeInTheDocument()
    })

    it('shows correct count of remaining steps', () => {
      render(<ConsoleOutput {...makeProps({ pendingSteps: 5 })} />)
      expect(screen.getByText(/5 restantes/)).toBeInTheDocument()
    })

    it('shows singular form for 1 step', () => {
      render(<ConsoleOutput {...makeProps({ pendingSteps: 1 })} />)
      expect(screen.getByText(/1 restante\b/)).toBeInTheDocument()
    })

    it('calls onNextStep when clicking the step button', async () => {
      const onNextStep = vi.fn()
      render(<ConsoleOutput {...makeProps({ pendingSteps: 2, onNextStep })} />)
      await userEvent.click(screen.getByRole('button', { name: /Siguiente paso/ }))
      expect(onNextStep).toHaveBeenCalledOnce()
    })

    it('hides textarea when pendingSteps > 0', () => {
      render(<ConsoleOutput {...makeProps({ pendingSteps: 1, sessionActive: true })} />)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('history navigation', () => {
    function StatefulConsole() {
      const [val, setVal] = useState('')
      return (
        <ConsoleOutput
          {...makeProps({ sessionActive: true })}
          inputValue={val}
          onInputChange={setVal}
        />
      )
    }

    it('ArrowUp does nothing when history is empty', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.click(ta)
      await userEvent.keyboard('{ArrowUp}')
      expect(ta).toHaveValue('')
    })

    it('ArrowDown does nothing when not navigating history', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.click(ta)
      await userEvent.keyboard('{ArrowDown}')
      expect(ta).toHaveValue('')
    })

    it('ArrowUp after submit navigates to last item', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.type(ta, 'hola{Enter}')
      await userEvent.clear(ta)
      await userEvent.keyboard('{ArrowUp}')
      expect(ta).toHaveValue('hola')
    })

    it('ArrowUp twice with two items navigates to first', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.type(ta, 'primero{Enter}')
      await userEvent.clear(ta)
      await userEvent.type(ta, 'segundo{Enter}')
      await userEvent.clear(ta)
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      expect(ta).toHaveValue('primero')
    })

    it('ArrowDown after ArrowUp restores draft', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.type(ta, 'guardado{Enter}')
      await userEvent.clear(ta)
      await userEvent.type(ta, 'borrador')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowDown}')
      expect(ta).toHaveValue('borrador')
    })

    it('ArrowDown in middle of history navigates forward', async () => {
      render(<StatefulConsole />)
      const ta = screen.getByRole('textbox')
      await userEvent.type(ta, 'uno{Enter}')
      await userEvent.clear(ta)
      await userEvent.type(ta, 'dos{Enter}')
      await userEvent.clear(ta)
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowDown}')
      expect(ta).toHaveValue('dos')
    })
  })
})
