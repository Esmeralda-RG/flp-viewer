export interface InitBinding {
  name: string
  value: string
}

export interface InitEnvRow extends InitBinding {
  id: string
}

export type RuleKind = 'program' | 'expression' | 'primitive' | 'other'

export interface PipelineResult {
  grammarRkt: string
  environmentRkt: string
  mainRkt: string
  mainLockedLines: number[]
  errors: string[]
}

export interface MainGeneratorResult {
  content: string
  lockedLines: number[]
}
