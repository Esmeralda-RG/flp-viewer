import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnvHeader from '../environment/EnvHeader'

describe('EnvHeader', () => {
  it('hides the reset button and snapshot count when count is 0', () => {
    render(<EnvHeader count={0} onReset={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'reset vista' })).not.toBeInTheDocument()
  })

  it('shows the reset button and calls onReset', async () => {
    const onReset = vi.fn()
    render(<EnvHeader count={2} onReset={onReset} />)
    await userEvent.click(screen.getByRole('button', { name: 'reset vista' }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('hides the edit init-env button without the callback', () => {
    render(<EnvHeader count={0} onReset={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'editar init-env' })).not.toBeInTheDocument()
  })
})
