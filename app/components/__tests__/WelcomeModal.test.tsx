import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WelcomeModal from '../modals/WelcomeModal'

describe('WelcomeModal', () => {
  it('renders the modal by default', () => {
    render(<WelcomeModal />)
    expect(screen.getByText('Bienvenido a FLP Viewer')).toBeInTheDocument()
  })

  it('renders the three how-to steps', () => {
    render(<WelcomeModal />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('closes when clicking the "¡Empezar!" button', async () => {
    render(<WelcomeModal />)
    await userEvent.click(screen.getByRole('button', { name: '¡Empezar!' }))
    expect(screen.queryByText('Bienvenido a FLP Viewer')).not.toBeInTheDocument()
  })

  it('closes when clicking the backdrop', async () => {
    render(<WelcomeModal />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }))
    expect(screen.queryByText('Bienvenido a FLP Viewer')).not.toBeInTheDocument()
  })

  it('shows the subtitle with university name', () => {
    render(<WelcomeModal />)
    expect(screen.getByText(/Universidad del Valle/)).toBeInTheDocument()
  })
})
