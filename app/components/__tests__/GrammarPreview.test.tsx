import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GrammarPreview from '../modals/GrammarPreview'

describe('GrammarPreview', () => {
  it('renders regular lines with syntax coloring', () => {
    render(<GrammarPreview content={'(define x 1)'} onStubFill={vi.fn()} />)
    expect(screen.getByText('(define x 1)')).toBeInTheDocument()
  })

  it('renders a StubLine for stub comment lines', () => {
    render(<GrammarPreview content={'; ⚠ "diff-exp" — falta implementar'} onStubFill={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('forwards the token name and rule to onStubFill', async () => {
    const onStubFill = vi.fn()
    render(<GrammarPreview content={'; ⚠ "diff-exp" — falta implementar'} onStubFill={onStubFill} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '(diff-exp (a b) num){Enter}')
    expect(onStubFill).toHaveBeenCalledWith('diff-exp', '(diff-exp (a b) num)')
  })

  it('renders multiple lines', () => {
    render(<GrammarPreview content={'line1\nline2'} onStubFill={vi.fn()} />)
    expect(screen.getByText('line1')).toBeInTheDocument()
    expect(screen.getByText('line2')).toBeInTheDocument()
  })
})
