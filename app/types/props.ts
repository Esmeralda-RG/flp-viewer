import type { ReactNode } from 'react'
import type { ASTNode } from './ast'
import type { EnvFrame } from './environment'
import type { EditorFile, GeneratedGrammarFiles } from './editor'
import type { InitBinding } from './grammar'
import type { LogEntry } from './console'
import type { HelpSection } from './help'
import type { Example } from './examples'

export interface EditorPanelProps {
  files: EditorFile[]
  activeFileId: string
  onFileSelect: (id: string) => void
  onFileChange: (id: string, content: string) => void
}

export interface FileIconProps {
  name: string
}

export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  lockedLines?: number[]
}

export interface ConsoleOutputProps {
  logs: LogEntry[]
  inputValue: string
  onInputChange: (v: string) => void
  onSubmit: () => void
  running: boolean
  sessionActive: boolean
  onClear: () => void
  pendingSteps: number
  onNextStep: () => void
}

export interface EnvironmentPanelProps {
  frames: EnvFrame[]
  onEditInitEnv?: () => void
}

export interface FrameCardProps {
  frame: EnvFrame
  x: number
  y: number
}

export interface ArrowProps {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface EnvHeaderProps {
  count: number
  onReset: () => void
  onEditInitEnv?: () => void
}

export interface ASTViewerProps {
  ast: ASTNode | null
}

export interface TreeNodeProps {
  node: ASTNode
  depth: number
  isLast: boolean
  guides: boolean[]
  initialOpen: boolean
}

export interface GrammarModalProps {
  onClose: () => void
  onGenerate: (files: GeneratedGrammarFiles) => void
}

export interface GrammarPreviewProps {
  content: string
  onStubFill: (tokenName: string, rule: string) => void
}

export interface StubLineProps {
  tokenName: string
  onFill: (rule: string) => void
}

export interface SchemeLineProps {
  text: string
}

export interface HelpDrawerProps {
  open: boolean
  onClose: () => void
  sections: HelpSection[]
}

export interface MarkdownChildrenProps {
  children?: ReactNode
}

export interface MarkdownCodeProps extends MarkdownChildrenProps {
  className?: string
}

export interface PlaygroundLayoutProps {
  examples: Example[]
  helpSections: HelpSection[]
}

export interface NavbarProps {
  examples: Example[]
  onExampleSelect: (example: Example) => void
  onGrammarOpen: () => void
  onDownload: () => void
  onRun: () => void
  onStop: () => void
  onClear: () => void
  onHelpOpen: () => void
  running: boolean
  stepMode: boolean
  onStepModeToggle: () => void
}

export interface InitEnvModalProps {
  bindings: InitBinding[]
  onClose: () => void
  onApply: (bindings: InitBinding[]) => void
}

export interface StepProps {
  num: number
  children: ReactNode
}

export interface ResizeBarProps {
  className?: string
}
