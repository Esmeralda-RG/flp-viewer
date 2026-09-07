import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ASTTooltip from '../ast/ASTTooltip'

function rect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100, bottom: 120, left: 50, right: 200, width: 150, height: 20, x: 50, y: 100,
    toJSON() { return {} },
    ...overrides,
  } as DOMRect
}

describe('ASTTooltip', () => {
  it('renders the category and text via a portal on document.body', () => {
    render(<ASTTooltip anchorRect={rect()} category="call" categoryColor="#fff" text="una llamada" />)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.parentElement).toBe(document.body)
    expect(screen.getByText('call')).toBeInTheDocument()
    expect(screen.getByText(/una llamada/)).toBeInTheDocument()
  })

  it('positions below the anchor when there is enough space', () => {
    render(<ASTTooltip anchorRect={rect({ bottom: 100 })} category="c" categoryColor="#fff" text="t" />)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.style.top).toBe('104px')
  })

  it('positions above the anchor when there is not enough space below', () => {
    Object.defineProperty(window, 'innerHeight', { value: 150, configurable: true })
    render(<ASTTooltip anchorRect={rect({ top: 130, bottom: 140 })} category="c" categoryColor="#fff" text="t" />)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.style.top).toBe(`${130 - 90 - 4}px`)
  })
})
