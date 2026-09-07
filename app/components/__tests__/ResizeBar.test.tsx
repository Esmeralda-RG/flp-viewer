import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import ResizeBar from '../layout/ResizeBar'

vi.mock('react-resizable-panels', () => ({
  Separator: ({ className }: { className?: string }) => <div role="separator" className={className} />,
}))

describe('ResizeBar', () => {
  it('renders a separator with the merged class names', () => {
    const { container } = render(<ResizeBar className="extra-class" />)
    const separator = container.querySelector('[role="separator"]')
    expect(separator).toBeInTheDocument()
    expect(separator?.className).toContain('extra-class')
    expect(separator?.className).toContain('bg-[#3c3c3c]')
  })

  it('works without a className', () => {
    const { container } = render(<ResizeBar />)
    expect(container.querySelector('[role="separator"]')).toBeInTheDocument()
  })
})
