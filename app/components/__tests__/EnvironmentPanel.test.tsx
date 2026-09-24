import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnvironmentPanel from '../environment/EnvironmentPanel'
import type { EnvFrame } from '@/app/types/environment'

describe('EnvironmentPanel', () => {
  it('shows an empty state when there are no frames', () => {
    render(<EnvironmentPanel frames={[]} />)
    expect(screen.getByText('Sin ambientes activos')).toBeInTheDocument()
  })

  it('renders a card per frame and an arrow between them', () => {
    const frames: EnvFrame[] = [
      { label: 'empty-env', frames: [[]] },
      { label: 'extend', frames: [[{ name: 'x', value: '1', type: 'number' }]], parentFrameIndex: 0 },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    expect(screen.getByText('empty-env')).toBeInTheDocument()
    expect(screen.getByText('extend')).toBeInTheDocument()
    expect(container.querySelector('path[marker-end]')).toBeInTheDocument()
  })

  it('stacks frames that share a parent in the same column instead of spreading them out chronologically', () => {
    const frames: EnvFrame[] = [
      { label: 'empty-env', frames: [[]] },
      { label: 'extend', frames: [[{ name: 'x', value: '200', type: 'number' }]], parentFrameIndex: 0 },
      { label: 'extend', frames: [[{ name: 'f', value: '<procedure>', type: 'lambda' }]], parentFrameIndex: 1 },
      { label: 'extend', frames: [[{ name: 'x', value: '100', type: 'number' }]], parentFrameIndex: 2 },
      { label: 'extend', frames: [[{ name: 'z', value: '1', type: 'number' }]], parentFrameIndex: 1 },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    const cards = Array.from(container.querySelectorAll('[data-testid="env-frame"]'))
    const coordsOf = (el: Element) => {
      const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(el.getAttribute('transform') ?? '')
      return { x: Number(m?.[1]), y: Number(m?.[2]) }
    }

    // f (índice 2) y z (índice 4) comparten el mismo padre (1): misma columna, distinta fila.
    expect(coordsOf(cards[2]).x).toBe(coordsOf(cards[4]).x)
    expect(coordsOf(cards[2]).y).not.toBe(coordsOf(cards[4]).y)
    // x=100 (índice 3) es hijo de f (2), no de z: una columna más a la derecha que ambos.
    expect(coordsOf(cards[3]).x).toBeGreaterThan(coordsOf(cards[2]).x)

    // La flecha "extiende" de z va directo a su padre real (1), no al marco anterior (3).
    const arrow = container.querySelector('[data-testid="extends-arrow"][data-to="4"]')
    expect(arrow).toBeInTheDocument()
    expect(arrow).toHaveAttribute('data-from', '1')
  })

  it('does not draw an extends arrow for a frame with no parentFrameIndex', () => {
    const frames: EnvFrame[] = [
      { label: 'empty-env', frames: [[]] },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    expect(container.querySelector('[data-testid="extends-arrow"]')).not.toBeInTheDocument()
  })

  it('draws a target arrow from an assignment frame to the frame it mutated', () => {
    const frames: EnvFrame[] = [
      { label: 'empty-env', frames: [[]] },
      { label: 'extend', kind: 'binding', frames: [[{ name: 'x', value: '5', type: 'number' }]] },
      { label: 'extend', kind: 'binding', frames: [[{ name: 'x', value: '1', type: 'number' }]] },
      { label: 'asignación', kind: 'assignment', frames: [[{ name: 'x', value: '9', type: 'number' }]], targetFrameIndex: 2 },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    const arrow = container.querySelector('[data-testid="assign-target-arrow"]')
    expect(arrow).toBeInTheDocument()
    expect(arrow).toHaveAttribute('data-from', '3')
    expect(arrow).toHaveAttribute('data-to', '2')
  })

  it('does not draw a target arrow for plain binding frames', () => {
    const frames: EnvFrame[] = [
      { label: 'empty-env', frames: [[]] },
      { label: 'extend', frames: [[{ name: 'x', value: '1', type: 'number' }]] },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    expect(container.querySelector('[data-testid="assign-target-arrow"]')).not.toBeInTheDocument()
  })

  it('shows the snapshot count and calls onReset', async () => {
    const frames: EnvFrame[] = [{ label: 'empty-env', frames: [[]] }]
    render(<EnvironmentPanel frames={frames} />)
    expect(screen.getByText('1 snapshot')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'reset vista' }))
  })

  it('shows the plural snapshot label for multiple frames', () => {
    const frames: EnvFrame[] = [{ label: 'a', frames: [[]] }, { label: 'b', frames: [[]] }]
    render(<EnvironmentPanel frames={frames} />)
    expect(screen.getByText('2 snapshots')).toBeInTheDocument()
  })

  it('shows the edit init-env button only when the callback is passed', async () => {
    const onEditInitEnv = vi.fn()
    render(<EnvironmentPanel frames={[]} onEditInitEnv={onEditInitEnv} />)
    await userEvent.click(screen.getByRole('button', { name: 'editar init-env' }))
    expect(onEditInitEnv).toHaveBeenCalledOnce()
  })

  it('does not show the edit init-env button without the callback', () => {
    render(<EnvironmentPanel frames={[]} />)
    expect(screen.queryByRole('button', { name: 'editar init-env' })).not.toBeInTheDocument()
  })
})
