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
      { label: 'extend', frames: [[{ name: 'x', value: '1', type: 'number' }]] },
    ]
    const { container } = render(<EnvironmentPanel frames={frames} />)
    expect(screen.getByText('empty-env')).toBeInTheDocument()
    expect(screen.getByText('extend')).toBeInTheDocument()
    expect(container.querySelector('path[marker-end]')).toBeInTheDocument()
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
