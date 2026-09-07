export interface ASTNode {
  type: string
  value?: string | number | boolean
  children?: ASTNode[]
}

export type ASTCategory = 'program' | 'decl' | 'cond' | 'call' | 'func' | 'var' | 'num' | 'bool' | 'op' | 'other'

export type ExpandMode = 'partial' | 'all' | 'none'
