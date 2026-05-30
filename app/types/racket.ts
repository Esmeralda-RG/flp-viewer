import type { ASTNode } from './ast'
import type { EnvFrame } from './environment'

export interface EditorFileLike {
  name: string
  content: string
}

export interface StepResult {
  ast: ASTNode | null
  output: string | null
  environments: EnvFrame[]
}

export interface TraceResult {
  stdout: string
  stderr: string
  error: string | null
  steps: StepResult[]
  ast: ASTNode | null
  environments: EnvFrame[]
  output: string | null
}
