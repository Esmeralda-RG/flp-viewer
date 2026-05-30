export interface MetaFile {
  id: string
  name: string
  language: string
  lockedLines?: number[]
}

export interface Meta {
  id: string
  label: string
  description: string
  activeFileId: string
  files: MetaFile[]
}

export interface ExampleFile {
  id: string
  name: string
  content: string
  language: string
  lockedLines?: number[]
}

export interface Example {
  id: string
  label: string
  description: string
  code: string
  lockedLines?: number[]
  files?: ExampleFile[]
  activeFileId?: string
}
