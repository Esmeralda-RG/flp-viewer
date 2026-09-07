import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StubLine from '../modals/StubLine'

describe('StubLine', () => {
  it('does nothing on blur when the input is empty', async () => {
    const onFill = vi.fn()
    render(<StubLine tokenName="foo" onFill={onFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.click(input)
    await userEvent.tab()
    expect(onFill).not.toHaveBeenCalled()
    expect(screen.queryByText(/debe ser una regla completa/)).not.toBeInTheDocument()
  })

  it('shows an error when the value does not start with (', async () => {
    const onFill = vi.fn()
    render(<StubLine tokenName="foo" onFill={onFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'not-a-rule')
    await userEvent.tab()
    expect(screen.getByText(/debe ser una regla completa/)).toBeInTheDocument()
    expect(onFill).not.toHaveBeenCalled()
  })

  it('clears the error as soon as the user types again', async () => {
    const onFill = vi.fn()
    render(<StubLine tokenName="foo" onFill={onFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'bad')
    await userEvent.tab()
    expect(screen.getByText(/debe ser una regla completa/)).toBeInTheDocument()
    await userEvent.click(input)
    await userEvent.type(input, 'x')
    expect(screen.queryByText(/debe ser una regla completa/)).not.toBeInTheDocument()
  })

  it('commits a valid rule on Enter', async () => {
    const onFill = vi.fn()
    render(<StubLine tokenName="foo" onFill={onFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '(foo (x) num){Enter}')
    expect(onFill).toHaveBeenCalledWith('(foo (x) num)')
  })

  it('commits a valid rule on blur', async () => {
    const onFill = vi.fn()
    render(<StubLine tokenName="foo" onFill={onFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '(foo (x) num)')
    await userEvent.tab()
    expect(onFill).toHaveBeenCalledWith('(foo (x) num)')
  })
})
