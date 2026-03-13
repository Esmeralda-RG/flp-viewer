export type AstNode = {
  type: string
  value?: string
  children?: AstNode[]
}

export type EnvironmentEntry = {
  name: string
  value: string
}

export type EnvironmentState = {
  scopeName: string
  parentScopeName?: string
  entries: EnvironmentEntry[]
}

export type EvaluationStep = {
  environment: EnvironmentState
  log: string
}