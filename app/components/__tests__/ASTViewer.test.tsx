import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ASTViewer from '../ast/ASTViewer'
import type { ASTNode } from '@/app/types/ast'

function rootChevron(container: HTMLElement): string {
  const button = container.querySelector('.flex-1.overflow-auto button') as HTMLElement
  return button.querySelector('span')!.textContent!
}

describe('ASTViewer', () => {
  it('shows a placeholder message when there is no AST', () => {
    render(<ASTViewer ast={null} />)
    expect(screen.getByText('Ejecuta el código para ver el AST')).toBeInTheDocument()
  })

  it('renders the normalized tree when an AST is provided', () => {
    const ast: ASTNode = { type: 'call-exp', children: [{ type: 'string', value: 'x' }] }
    render(<ASTViewer ast={ast} />)
    expect(screen.getByText('call-exp')).toBeInTheDocument()
  })

  it('expands and collapses all nodes via the toolbar buttons', async () => {
    const ast: ASTNode = {
      type: 'call-exp',
      children: [{ type: 'call-exp', children: [{ type: 'string', value: 'x' }] }],
    }
    const { container } = render(<ASTViewer ast={ast} />)
    await userEvent.click(screen.getByRole('button', { name: 'expandir todo' }))
    expect(rootChevron(container)).toBe('▾')

    await userEvent.click(screen.getByRole('button', { name: 'colapsar todo' }))
    expect(rootChevron(container)).toBe('▸')
  })

  it('does not show toolbar buttons when there is no AST', () => {
    render(<ASTViewer ast={null} />)
    expect(screen.queryByRole('button', { name: 'expandir todo' })).not.toBeInTheDocument()
  })

  it('shows a tooltip after hovering a node long enough', () => {
    vi.useFakeTimers()
    const ast: ASTNode = { type: 'call-exp', value: 1 }
    render(<ASTViewer ast={ast} />)
    const button = screen.getByRole('button', { name: /call-exp/ })
    fireEvent.mouseEnter(button)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
