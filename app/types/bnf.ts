export type TokenKind =
  | 'NONTERMINAL'
  | 'TERMINAL'
  | 'PRODUCES'
  | 'ALT'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'STAR'
  | 'PLUS'
  | 'QUESTION'
  | 'ARROW'
  | 'IDENT'
  | 'EOF'

export interface Token {
  kind: TokenKind
  value: string
  line: number
  col: number
}

export type BNFItem =
  | { kind: 'nonterminal'; name: string }
  | { kind: 'terminal'; value: string }
  | { kind: 'nonterminal-rep'; name: string; op: '*' | '+' | '?' }
  | { kind: 'group'; items: BNFItem[]; op: '*' | '+' | '?' | null }

export interface Production {
  items: BNFItem[]
  variantName: string | null
}

export interface GrammarRule {
  lhs: string
  productions: Production[]
}

export interface GrammarAST {
  rules: GrammarRule[]
}
