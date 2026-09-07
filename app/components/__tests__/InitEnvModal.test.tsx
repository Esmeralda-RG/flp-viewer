import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InitEnvModal from '../modals/InitEnvModal'

describe('InitEnvModal', () => {
  it('shows an empty state when there are no bindings', () => {
    render(<InitEnvModal bindings={[]} onClose={vi.fn()} onApply={vi.fn()} />)
    expect(screen.getByText(/ambiente vacío/)).toBeInTheDocument()
  })

  it('renders a row per binding with its inferred type', () => {
    render(<InitEnvModal bindings={[{ name: 'x', value: '42' }]} onClose={vi.fn()} onApply={vi.fn()} />)
    expect(screen.getByDisplayValue('x')).toBeInTheDocument()
    expect(screen.getByDisplayValue('42')).toBeInTheDocument()
    expect(screen.getByText('number')).toBeInTheDocument()
  })

  it('adds a new empty row', async () => {
    render(<InitEnvModal bindings={[]} onClose={vi.fn()} onApply={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Agregar variable/ }))
    expect(screen.getByPlaceholderText('x')).toBeInTheDocument()
  })

  it('removes a row', async () => {
    const { container } = render(<InitEnvModal bindings={[{ name: 'x', value: '1' }]} onClose={vi.fn()} onApply={vi.fn()} />)
    const row = screen.getByDisplayValue('x').closest('.items-center')!
    const removeButton = row.querySelector('button')!
    await userEvent.click(removeButton)
    expect(screen.queryByDisplayValue('x')).not.toBeInTheDocument()
    expect(container.querySelector('button')).toBeTruthy()
  })

  it('updates the name and value of a row', async () => {
    render(<InitEnvModal bindings={[{ name: '', value: '' }]} onClose={vi.fn()} onApply={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('x'), 'y')
    await userEvent.type(screen.getByPlaceholderText('0'), '"hi"')
    expect(screen.getByDisplayValue('y')).toBeInTheDocument()
    expect(screen.getByText('string')).toBeInTheDocument()
  })

  it('shows a duplicate names warning and disables apply', async () => {
    render(<InitEnvModal bindings={[{ name: 'x', value: '1' }]} onClose={vi.fn()} onApply={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Agregar variable/ }))
    const nameInputs = screen.getAllByPlaceholderText('x')
    await userEvent.type(nameInputs[1], 'x')
    expect(screen.getByText(/Nombres duplicados/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
  })

  it('calls onApply with trimmed, non-empty bindings only', async () => {
    const onApply = vi.fn()
    render(
      <InitEnvModal
        bindings={[{ name: ' x ', value: ' 1 ' }, { name: 'empty', value: '' }]}
        onClose={vi.fn()}
        onApply={onApply}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).toHaveBeenCalledWith([{ name: 'x', value: '1' }])
  })

  it('does not call onApply when there are duplicate names', async () => {
    const onApply = vi.fn()
    render(<InitEnvModal bindings={[{ name: 'x', value: '1' }, { name: 'x', value: '2' }]} onClose={vi.fn()} onApply={onApply} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onApply).not.toHaveBeenCalled()
  })

  it('calls onClose from the cancel button and the backdrop', async () => {
    const onClose = vi.fn()
    render(<InitEnvModal bindings={[]} onClose={onClose} onApply={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByLabelText('Close modal'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('closes on Escape key from the backdrop', () => {
    const onClose = vi.fn()
    render(<InitEnvModal bindings={[]} onClose={onClose} onApply={vi.fn()} />)
    const backdrop = screen.getByLabelText('Close modal')
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on other keys from the backdrop', () => {
    const onClose = vi.fn()
    render(<InitEnvModal bindings={[]} onClose={onClose} onApply={vi.fn()} />)
    const backdrop = screen.getByLabelText('Close modal')
    backdrop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
