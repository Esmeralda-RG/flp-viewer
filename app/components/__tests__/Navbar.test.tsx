import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '../layout/Navbar'
import type { Example } from '@/app/types/examples'

const examples: Example[] = [
  { id: 'ex1', label: 'Hola Mundo', description: 'Ejemplo básico', code: '(print "hola")' },
  { id: 'ex2', label: 'Let binding', description: 'Variables locales', code: '(let x = 1 in x)' },
]

function makeProps(overrides = {}) {
  return {
    examples,
    onExampleSelect: vi.fn(),
    onGrammarOpen: vi.fn(),
    onDownload: vi.fn(),
    onRun: vi.fn(),
    onStop: vi.fn(),
    onClear: vi.fn(),
    onHelpOpen: vi.fn(),
    running: false,
    stepMode: false,
    onStepModeToggle: vi.fn(),
    ...overrides,
  }
}

describe('Navbar', () => {
  it('renders the app title', () => {
    render(<Navbar {...makeProps()} />)
    expect(screen.getByText('FLP Viewer')).toBeInTheDocument()
  })

  it('shows "▶ Ejecutar" when not running', () => {
    render(<Navbar {...makeProps({ running: false })} />)
    expect(screen.getByRole('button', { name: /Ejecutar/ })).toBeInTheDocument()
  })

  it('shows "■ Detener" when running', () => {
    render(<Navbar {...makeProps({ running: true })} />)
    expect(screen.getByRole('button', { name: /Detener/ })).toBeInTheDocument()
  })

  it('calls onRun when clicking Ejecutar', async () => {
    const onRun = vi.fn()
    render(<Navbar {...makeProps({ onRun })} />)
    await userEvent.click(screen.getByRole('button', { name: /Ejecutar/ }))
    expect(onRun).toHaveBeenCalledOnce()
  })

  it('calls onStop when clicking Detener', async () => {
    const onStop = vi.fn()
    render(<Navbar {...makeProps({ running: true, onStop })} />)
    await userEvent.click(screen.getByRole('button', { name: /Detener/ }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('calls onClear when clicking Limpiar', async () => {
    const onClear = vi.fn()
    render(<Navbar {...makeProps({ onClear })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('calls onGrammarOpen when clicking Gramática', async () => {
    const onGrammarOpen = vi.fn()
    render(<Navbar {...makeProps({ onGrammarOpen })} />)
    await userEvent.click(screen.getByRole('button', { name: /Gramática/ }))
    expect(onGrammarOpen).toHaveBeenCalledOnce()
  })

  it('calls onDownload when clicking Descargar', async () => {
    const onDownload = vi.fn()
    render(<Navbar {...makeProps({ onDownload })} />)
    await userEvent.click(screen.getByRole('button', { name: /Descargar/ }))
    expect(onDownload).toHaveBeenCalledOnce()
  })

  it('calls onHelpOpen when clicking Ayuda', async () => {
    const onHelpOpen = vi.fn()
    render(<Navbar {...makeProps({ onHelpOpen })} />)
    await userEvent.click(screen.getByRole('button', { name: /Ayuda/ }))
    expect(onHelpOpen).toHaveBeenCalledOnce()
  })

  it('opens examples dropdown and shows example labels', async () => {
    render(<Navbar {...makeProps()} />)
    await userEvent.click(screen.getByRole('button', { name: /Ejemplos/ }))
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument()
    expect(screen.getByText('Let binding')).toBeInTheDocument()
  })

  it('calls onExampleSelect and closes dropdown when example is clicked', async () => {
    const onExampleSelect = vi.fn()
    render(<Navbar {...makeProps({ onExampleSelect })} />)
    await userEvent.click(screen.getByRole('button', { name: /Ejemplos/ }))
    await userEvent.click(screen.getByText('Hola Mundo'))
    expect(onExampleSelect).toHaveBeenCalledWith(examples[0])
    expect(screen.queryByText('Let binding')).not.toBeInTheDocument()
  })

  it('applies active style to "Paso a paso" button when stepMode is true', () => {
    render(<Navbar {...makeProps({ stepMode: true })} />)
    const btn = screen.getByRole('button', { name: /Paso a paso/ })
    expect(btn.className).toContain('bg-blue-600/30')
  })

  it('calls onStepModeToggle when clicking Paso a paso', async () => {
    const onStepModeToggle = vi.fn()
    render(<Navbar {...makeProps({ onStepModeToggle })} />)
    await userEvent.click(screen.getByRole('button', { name: /Paso a paso/ }))
    expect(onStepModeToggle).toHaveBeenCalledOnce()
  })
})
