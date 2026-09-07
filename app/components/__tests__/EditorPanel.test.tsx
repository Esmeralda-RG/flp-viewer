import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditorPanel from '../editor/EditorPanel'
import type { EditorFile } from '@/app/types/editor'

vi.mock('../editor/CodeEditor', () => ({
  default: ({ value }: { value: string }) => <div data-testid="code-editor">{value}</div>,
}))

function makeFiles(): EditorFile[] {
  return [
    { id: 'main', revision: 0, name: 'main.rkt', content: 'main content', language: 'scheme' },
    { id: 'utils', revision: 0, name: 'utils.rkt', content: 'utils content', language: 'scheme' },
  ]
}

describe('EditorPanel', () => {
  it('renders a tab per file', () => {
    render(<EditorPanel files={makeFiles()} activeFileId="main" onFileSelect={vi.fn()} onFileChange={vi.fn()} glossaryTerms={[]} />)
    expect(screen.getByRole('button', { name: /main\.rkt/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /utils\.rkt/ })).toBeInTheDocument()
  })

  it('shows the active file language', () => {
    render(<EditorPanel files={makeFiles()} activeFileId="main" onFileSelect={vi.fn()} onFileChange={vi.fn()} glossaryTerms={[]} />)
    expect(screen.getByText('scheme')).toBeInTheDocument()
  })

  it('calls onFileSelect when clicking a tab', async () => {
    const onFileSelect = vi.fn()
    render(<EditorPanel files={makeFiles()} activeFileId="main" onFileSelect={onFileSelect} onFileChange={vi.fn()} glossaryTerms={[]} />)
    await userEvent.click(screen.getByRole('button', { name: /utils\.rkt/ }))
    expect(onFileSelect).toHaveBeenCalledWith('utils')
  })

  it('renders every file editor but only shows the active one', () => {
    render(<EditorPanel files={makeFiles()} activeFileId="utils" onFileSelect={vi.fn()} onFileChange={vi.fn()} glossaryTerms={[]} />)
    const editors = screen.getAllByTestId('code-editor')
    expect(editors).toHaveLength(2)
  })
})
