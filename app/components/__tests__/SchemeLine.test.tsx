import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SchemeLine from '../modals/SchemeLine'

describe('SchemeLine', () => {
  it('colors a #lang line', () => {
    const { container } = render(<SchemeLine text="#lang eopl" />)
    expect(container.querySelector('.text-green-400')).toBeInTheDocument()
  })

  it('colors a define line', () => {
    const { container } = render(<SchemeLine text="  (define x 1)" />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('colors a comment line', () => {
    const { container } = render(<SchemeLine text="; a comment" />)
    expect(container.querySelector('.text-zinc-400')).toBeInTheDocument()
  })

  it('falls back to plain color for unmatched lines', () => {
    const { container } = render(<SchemeLine text="(some-code)" />)
    expect(container.querySelector('.text-zinc-300')).toBeInTheDocument()
  })
})
