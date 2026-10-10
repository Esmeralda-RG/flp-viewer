import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpandablePanel from '../layout/ExpandablePanel'
import ExpandButton from '../layout/ExpandButton'

describe('ExpandablePanel', () => {
  it('renders children inline when collapsed', () => {
    render(<ExpandablePanel expanded={false} onCollapse={vi.fn()}><p>hola</p></ExpandablePanel>)
    expect(screen.getByText('hola').parentElement).not.toHaveClass('fixed')
  })

  it('covers the viewport when expanded', () => {
    render(<ExpandablePanel expanded onCollapse={vi.fn()}><p>hola</p></ExpandablePanel>)
    expect(screen.getByText('hola').parentElement).toHaveClass('fixed', 'inset-0')
  })

  it('collapses on Escape only while expanded', () => {
    const onCollapse = vi.fn()
    const { rerender } = render(<ExpandablePanel expanded={false} onCollapse={onCollapse}><p>x</p></ExpandablePanel>)
    fireEvent.keyDown(globalThis as unknown as Window, { key: 'Escape' })
    expect(onCollapse).not.toHaveBeenCalled()

    rerender(<ExpandablePanel expanded onCollapse={onCollapse}><p>x</p></ExpandablePanel>)
    fireEvent.keyDown(globalThis as unknown as Window, { key: 'a' })
    expect(onCollapse).not.toHaveBeenCalled()
    fireEvent.keyDown(globalThis as unknown as Window, { key: 'Escape' })
    expect(onCollapse).toHaveBeenCalledOnce()
  })
})

describe('ExpandButton', () => {
  it('offers full screen and toggles on click', async () => {
    const onToggle = vi.fn()
    render(<ExpandButton expanded={false} onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pantalla completa' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('offers to exit when expanded', () => {
    render(<ExpandButton expanded onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Salir de pantalla completa' })).toBeInTheDocument()
  })
})
