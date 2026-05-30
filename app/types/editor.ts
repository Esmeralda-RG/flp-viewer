export interface EditorFile {
  id: string
   
  revision: number
  name: string
  content: string
  language: string
  lockedLines?: number[]
}

export interface GeneratedGrammarFiles {
  input: string
  grammarRkt: string
  environmentRkt: string
  mainRkt: string
  mainLockedLines: number[]
}
