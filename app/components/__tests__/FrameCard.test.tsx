import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import FrameCard from '../environment/FrameCard'
import type { EnvFrame } from '@/app/types/environment'

function renderSvg(frame: EnvFrame) {
  return render(
    <svg>
      <FrameCard frame={frame} x={0} y={0} />
    </svg>
  )
}

describe('FrameCard', () => {
  it('renders the frame label', () => {
    const { getByText } = renderSvg({ label: 'init-env', frames: [[]] })
    expect(getByText('init-env')).toBeInTheDocument()
  })

  it('renders bindings with name, value and type', () => {
    const { getByText } = renderSvg({
      label: 'extend',
      frames: [[{ name: 'x', value: '42', type: 'number' }]],
    })
    expect(getByText('x')).toBeInTheDocument()
    expect(getByText('42')).toBeInTheDocument()
    expect(getByText('number')).toBeInTheDocument()
  })

  it('truncates long values', () => {
    const longValue = 'a'.repeat(30)
    const { getByText } = renderSvg({
      label: 'extend',
      frames: [[{ name: 'x', value: longValue, type: 'string' }]],
    })
    expect(getByText(`${'a'.repeat(16)}…`)).toBeInTheDocument()
  })

  it('renders a separator line between multiple sub-frames', () => {
    const { container } = renderSvg({
      label: 'extend',
      frames: [[{ name: 'x', value: '1', type: 'number' }], [{ name: 'y', value: '2', type: 'number' }]],
    })
    expect(container.querySelector('line')).toBeInTheDocument()
  })
})
