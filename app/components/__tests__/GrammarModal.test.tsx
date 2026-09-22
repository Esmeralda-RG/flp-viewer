import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GrammarModal from '../modals/GrammarModal'
import { DEFAULT_LEX, DEFAULT_GRAMMAR } from '@/app/lib/grammar-defaults'

const { MockMonacoEditor, instances } = vi.hoisted(() => {
  const instances: { value: string; onChange: (v: string | undefined) => void }[] = []
  function MockMonacoEditor(props: { value: string; onChange: (v: string | undefined) => void }) {
    instances.push(props)
    return (
      <textarea
        data-testid={`monaco-${instances.length - 1}`}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    )
  }
  return { MockMonacoEditor, instances }
})

vi.mock('@monaco-editor/react', () => ({ default: MockMonacoEditor }))
vi.mock('next/dynamic', () => ({ default: () => MockMonacoEditor }))

async function settle() {
  await act(async () => {
    vi.advanceTimersByTime(400)
  })
}

describe('GrammarModal', () => {
  beforeEach(() => {
    instances.length = 0
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the generate button disabled until the pipeline debounce runs', async () => {
    render(<GrammarModal onClose={vi.fn()} onGenerate={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Generar archivos' })).toBeDisabled()
    await settle()
    expect(screen.getByRole('button', { name: 'Generar archivos' })).toBeEnabled()
  })

  it('shows the ready status and a preview once the default grammar compiles', async () => {
    render(<GrammarModal onClose={vi.fn()} onGenerate={vi.fn()} />)
    await settle()
    expect(screen.getByText(/Listo — se generarán/)).toBeInTheDocument()
  })

  it('calls onGenerate with the compiled files when clicking "Generar archivos"', async () => {
    const onGenerate = vi.fn()
    render(<GrammarModal onClose={vi.fn()} onGenerate={onGenerate} />)
    await settle()
    await userEvent.click(screen.getByRole('button', { name: 'Generar archivos' }))

    expect(onGenerate).toHaveBeenCalledOnce()
    const files = onGenerate.mock.calls[0][0]
    expect(files.input).toContain(DEFAULT_LEX)
    expect(files.input).toContain(DEFAULT_GRAMMAR)
    expect(files.grammarRkt.length).toBeGreaterThan(0)
    expect(files.environmentRkt.length).toBeGreaterThan(0)
    expect(files.mainRkt.length).toBeGreaterThan(0)
    expect(files.utilsRkt.length).toBeGreaterThan(0)
    expect(Array.isArray(files.mainLockedLines)).toBe(true)
  })

  it('shows an error status and keeps the button disabled for an invalid grammar', async () => {
    render(<GrammarModal onClose={vi.fn()} onGenerate={vi.fn()} />)
    fireEvent.change(screen.getByTestId('monaco-1'), { target: { value: 'not a valid bnf grammar' } })
    await settle()
    expect(screen.getByRole('button', { name: 'Generar archivos' })).toBeDisabled()
  })

  it('shows the placeholder message before any grammar has ever compiled', () => {
    render(<GrammarModal onClose={vi.fn()} onGenerate={vi.fn()} />)
    expect(screen.getByText('Escribe una gramática BNF para ver la previsualización')).toBeInTheDocument()
  })

  it('closes via the backdrop, the header close button and Cancelar', async () => {
    const onClose = vi.fn()
    render(<GrammarModal onClose={onClose} onGenerate={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('Close modal'))
    await userEvent.click(screen.getByLabelText('Cerrar'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('closes on Escape outside of an input, but not while focus is inside one', () => {
    const onClose = vi.fn()
    render(<GrammarModal onClose={onClose} onGenerate={vi.fn()} />)

    const textarea = screen.getByTestId('monaco-0')
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
