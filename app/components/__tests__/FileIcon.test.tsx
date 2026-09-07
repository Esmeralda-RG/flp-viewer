import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FileIcon from '../editor/FileIcon'

describe('FileIcon', () => {
  it('shows the file extension', () => {
    render(<FileIcon name="main.rkt" />)
    expect(screen.getByText('rkt')).toBeInTheDocument()
  })

  it('falls back to the default color for unknown extensions', () => {
    const { container } = render(<FileIcon name="README.zzz" />)
    expect(container.querySelector('.text-zinc-400')).toBeInTheDocument()
  })

  it('handles a name with no extension', () => {
    render(<FileIcon name="Makefile" />)
    expect(screen.getByText('Makefile')).toBeInTheDocument()
  })
})
