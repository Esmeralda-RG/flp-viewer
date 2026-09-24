import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Arrow from '../environment/Arrow'

describe('Arrow', () => {
  it('renders a path with a curve between the two points', () => {
    const { container } = render(
      <svg>
        <Arrow x1={0} y1={0} x2={100} y2={50} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
    expect(path?.getAttribute('d')).toBe('M0,0 C50,0 50,50 100,50')
    expect(path).toHaveAttribute('stroke', '#4b5563')
    expect(path).toHaveAttribute('marker-end', 'url(#arrowhead)')
    expect(path).not.toHaveAttribute('stroke-dasharray')
  })

  it('applies a custom color, dash pattern, marker and test attributes', () => {
    const { container } = render(
      <svg>
        <Arrow
          x1={0} y1={0} x2={100} y2={50}
          color="#fbbf24" dashed markerId="arrowhead-target"
          testId="assign-target-arrow" dataFrom={3} dataTo={1}
        />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('stroke', '#fbbf24')
    expect(path).toHaveAttribute('stroke-dasharray', '4 3')
    expect(path).toHaveAttribute('marker-end', 'url(#arrowhead-target)')
    expect(path).toHaveAttribute('data-testid', 'assign-target-arrow')
    expect(path).toHaveAttribute('data-from', '3')
    expect(path).toHaveAttribute('data-to', '1')
  })
})
