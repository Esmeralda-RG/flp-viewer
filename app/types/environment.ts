export interface Binding {
  name: string
  value: string
  type: string
}

export interface EnvFrame {
  label: string

  frames: Binding[][]
}

export interface Transform {
  x: number
  y: number
  k: number
}
