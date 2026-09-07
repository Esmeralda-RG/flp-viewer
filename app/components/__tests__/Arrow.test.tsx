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
  })
})
