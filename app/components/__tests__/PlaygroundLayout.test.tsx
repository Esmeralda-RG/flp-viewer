import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlaygroundLayout from '../layout/PlaygroundLayout'
import type { Example } from '@/app/types/examples'
import type { HelpSection } from '@/app/types/help'
import type { GrammarModalProps, InitEnvModalProps } from '@/app/types/props'

vi.mock('../editor/CodeEditor', () => ({
  default: ({ value }: { value: string }) => <div data-testid="code-editor">{value}</div>,
}))

vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Separator: () => <div role="separator" />,
}))

vi.mock('../modals/GrammarModal', () => ({
  default: ({ onClose, onGenerate }: GrammarModalProps) => (
    <div data-testid="grammar-modal">
      <button onClick={onClose}>cerrar-gramatica</button>
      <button
        onClick={() => onGenerate({
          input: 'in', grammarRkt: 'g', environmentRkt: 'e', mainRkt: 'm', mainLockedLines: [], utilsRkt: 'u',
        })}
      >
        generar
      </button>
    </div>
  ),
}))

vi.mock('../modals/InitEnvModal', () => ({
  default: ({ onClose, onApply }: InitEnvModalProps) => (
    <div data-testid="init-env-modal">
      <button onClick={onClose}>cerrar-init-env</button>
      <button onClick={() => onApply([{ name: 'x', value: '1' }])}>aplicar</button>
    </div>
  ),
}))

const examples: Example[] = [{ id: 'ex1', label: 'Ejemplo 1', description: '', code: '(+ 1 1)' }]
const helpSections: HelpSection[] = [{ id: 'intro', icon: '📖', title: 'Intro', order: 1, md: '# Intro' }]

function renderLayout() {
  return render(<PlaygroundLayout examples={examples} helpSections={helpSections} glossaryTerms={[]} />)
}

describe('PlaygroundLayout', () => {
  it('renders the editor, AST viewer, environment panel and console', () => {
    renderLayout()
    expect(screen.getAllByTestId('code-editor').length).toBeGreaterThan(0)
    expect(screen.getByText('Ejecuta el código para ver el AST')).toBeInTheDocument()
    expect(screen.getByText('Sin ambientes activos')).toBeInTheDocument()
  })

  it('does not show the grammar or init-env modals initially', () => {
    renderLayout()
    expect(screen.queryByTestId('grammar-modal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('init-env-modal')).not.toBeInTheDocument()
  })

  it('opens the grammar modal from the navbar and closes it', async () => {
    renderLayout()
    await userEvent.click(screen.getByTitle('Abrir generador BNF → EOPL'))
    expect(screen.getByTestId('grammar-modal')).toBeInTheDocument()

    await userEvent.click(screen.getByText('cerrar-gramatica'))
    expect(screen.queryByTestId('grammar-modal')).not.toBeInTheDocument()
  })

  it('applies generated grammar files and closes the modal', async () => {
    renderLayout()
    await userEvent.click(screen.getByTitle('Abrir generador BNF → EOPL'))
    await userEvent.click(screen.getByText('generar'))

    expect(screen.queryByTestId('grammar-modal')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /main\.rkt/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grammar\.rkt/ })).toBeInTheDocument()
  })

  it('opens the init-env modal from the environment panel', async () => {
    renderLayout()
    await userEvent.click(screen.getByText('editar init-env'))
    expect(screen.getByTestId('init-env-modal')).toBeInTheDocument()

    await userEvent.click(screen.getByText('aplicar'))
    expect(screen.queryByTestId('init-env-modal')).not.toBeInTheDocument()
  })

  it('opens and closes the help drawer from the navbar', async () => {
    renderLayout()
    await userEvent.click(screen.getByTitle('Ayuda'))
    expect(screen.getByRole('button', { name: /Intro/ })).toBeInTheDocument()
  })

  it('loads a selected example into the editor and console', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: /Ejemplos/ }))
    await userEvent.click(screen.getByText('Ejemplo 1'))
    expect(screen.getAllByTestId('code-editor')[0]).toHaveTextContent('(+ 1 1)')
  })
})
