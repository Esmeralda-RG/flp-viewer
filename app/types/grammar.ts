export interface InitBinding {
  name: string
  value: string
}

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
