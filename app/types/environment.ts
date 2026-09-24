export interface Binding {
  name: string
  value: string
  type: string
}

export type FrameKind = 'binding' | 'assignment'

export interface EnvFrame {
  label: string
  kind?: FrameKind
  frames: Binding[][]
  targetFrameIndex?: number
  parentFrameIndex?: number
}

export interface Transform {
  x: number
  y: number
  k: number
}
