import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HelpDrawer from '../help/HelpDrawer'
import type { HelpSection } from '@/app/types/help'

const richMd = `# Título principal

## Subtítulo h2

### Subtítulo h3

Párrafo con **negrita** y *cursiva*.

- item uno
- item dos

1. ordenado uno
2. ordenado dos

\`código inline\`

\`\`\`scheme
(define x 1)
\`\`\`

> Una cita importante

| Col A | Col B |
|-------|-------|
| val1  | val2  |

---
`

const sections: HelpSection[] = [
  { id: 'intro', icon: '📖', title: 'Introducción', order: 1, md: '# Introducción\nBienvenido al sistema.' },
  { id: 'bnf', icon: '⚙', title: 'Gramática BNF', order: 2, md: '# BNF\nDefine tu gramática aquí.' },
  { id: 'env', icon: '🌐', title: 'Ambiente', order: 3, md: '# Ambiente\nVariables y bindings.' },
  { id: 'rich', icon: '📝', title: 'Referencia', order: 4, md: richMd },
]

function makeProps(overrides = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    sections,
    examples: [],
    onLoadExample: vi.fn(),
    ...overrides,
  }
}

describe('HelpDrawer', () => {
  it('renders nothing when closed and not yet visible', () => {
    const { container } = render(<HelpDrawer {...makeProps({ open: false })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders section titles in the nav when open', () => {
    render(<HelpDrawer {...makeProps()} />)
    expect(screen.getByRole('button', { name: /Introducción/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gramática BNF/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ambiente/ })).toBeInTheDocument()
  })

  it('renders content of the first section by default', () => {
    render(<HelpDrawer {...makeProps()} />)
    expect(screen.getByText('Bienvenido al sistema.')).toBeInTheDocument()
  })

  it('calls onClose when clicking the close button', async () => {
    const onClose = vi.fn()
    render(<HelpDrawer {...makeProps({ onClose })} />)
    const header = screen.getByText('Ayuda — EOPL / FLP Viewer').parentElement!
    await userEvent.click(within(header).getByRole('button', { name: 'Cerrar ayuda' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('switches content when clicking a different section', async () => {
    render(<HelpDrawer {...makeProps()} />)
    await userEvent.click(screen.getByRole('button', { name: /Gramática BNF/ }))
    expect(screen.getByText('Define tu gramática aquí.')).toBeInTheDocument()
  })

  it('highlights the active section', async () => {
    render(<HelpDrawer {...makeProps()} />)
    const btn = screen.getByRole('button', { name: /Introducción/ })
    expect(btn.className).toContain('bg-blue-600/20')
  })

  describe('search', () => {
    it('renders the search input', () => {
      render(<HelpDrawer {...makeProps()} />)
      expect(screen.getByPlaceholderText('Buscar en la ayuda…')).toBeInTheDocument()
    })

    it('filters sections by title', async () => {
      render(<HelpDrawer {...makeProps()} />)
      await userEvent.type(screen.getByPlaceholderText('Buscar en la ayuda…'), 'BNF')
      expect(screen.getByRole('button', { name: /Gramática BNF/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Introducción/ })).not.toBeInTheDocument()
    })

    it('filters sections by content', async () => {
      render(<HelpDrawer {...makeProps()} />)
      await userEvent.type(screen.getByPlaceholderText('Buscar en la ayuda…'), 'bindings')
      expect(screen.getByRole('button', { name: /Ambiente/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Gramática BNF/ })).not.toBeInTheDocument()
    })

    it('shows "Sin resultados" when nothing matches', async () => {
      render(<HelpDrawer {...makeProps()} />)
      await userEvent.type(screen.getByPlaceholderText('Buscar en la ayuda…'), 'xyznotfound')
      expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    })

    it('shows clear button when query is non-empty', async () => {
      render(<HelpDrawer {...makeProps()} />)
      await userEvent.type(screen.getByPlaceholderText('Buscar en la ayuda…'), 'hola')
      const searchBox = screen.getByPlaceholderText('Buscar en la ayuda…').parentElement!
      expect(within(searchBox).getAllByRole('button')).toHaveLength(1)
    })

    it('clears the search and restores all sections', async () => {
      render(<HelpDrawer {...makeProps()} />)
      const input = screen.getByPlaceholderText('Buscar en la ayuda…')
      await userEvent.type(input, 'BNF')
      const searchBox = input.parentElement!
      await userEvent.click(within(searchBox).getByRole('button'))
      expect(screen.getByRole('button', { name: /Introducción/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Ambiente/ })).toBeInTheDocument()
    })
  })

  describe('markdown rendering', () => {
    async function renderRich() {
      render(<HelpDrawer {...makeProps()} />)
      await userEvent.click(screen.getByRole('button', { name: /Referencia/ }))
    }

    it.each([
      ['h2 headings', 'Subtítulo h2'],
      ['h3 headings', 'Subtítulo h3'],
      ['ordered list items', 'ordenado uno'],
      ['inline code', 'código inline'],
      ['code block', '(define x 1)'],
      ['blockquote', 'Una cita importante'],
      ['strong (bold)', 'negrita'],
      ['em (italic)', 'cursiva'],
    ])('renders %s', async (_label, text) => {
      await renderRich()
      expect(screen.getByText(text)).toBeInTheDocument()
    })

    it('renders unordered list items', async () => {
      await renderRich()
      expect(screen.getByText('item uno')).toBeInTheDocument()
      expect(screen.getByText('item dos')).toBeInTheDocument()
    })

    it('renders table with headers and cells', async () => {
      await renderRich()
      expect(screen.getByText('Col A')).toBeInTheDocument()
      expect(screen.getByText('val1')).toBeInTheDocument()
    })

    it('renders horizontal rule', async () => {
      await renderRich()
      expect(document.querySelector('hr')).toBeInTheDocument()
    })
  })
})
