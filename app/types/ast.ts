export interface ASTNode {
  type: string
  value?: string | number | boolean
  children?: ASTNode[]
}
