export interface Binding {
  name: string
  value: string
  type: string
}

export interface EnvFrame {
  label: string
   
  frames: Binding[][]
}
