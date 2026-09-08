import type { TokenKind, Token } from '@/app/types/bnf'

export class LexError extends Error {
  constructor(message: string, public line: number, public col: number) {
    super(`[Línea ${line}:${col}] ${message}`)
  }
}

const PUNCTUATION: Partial<Record<string, TokenKind>> = {
  '|': 'ALT',
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  '*': 'STAR',
  '+': 'PLUS',
  '?': 'QUESTION',
}

class Lexer {
  private i = 0
  private line = 1
  private lineStart = 0
  private readonly tokens: Token[] = []

  constructor(private readonly input: string) {}

  private col(): number {
    return this.i - this.lineStart + 1
  }

  private push(kind: TokenKind, value: string): void {
    this.tokens.push({ kind, value, line: this.line, col: this.col() - value.length })
  }

  private skipNewline(): boolean {
    if (this.input[this.i] !== '\n') return false
    this.line++
    this.lineStart = ++this.i
    return true
  }

  private skipWhitespace(): boolean {
    const ch = this.input[this.i]
    if (ch !== ' ' && ch !== '\t' && ch !== '\r') return false
    this.i++
    return true
  }

  private skipComment(): boolean {
    const ch = this.input[this.i]
    const isComment = ch === ';' || ch === '#' || (ch === '/' && this.input[this.i + 1] === '/')
    if (!isComment) return false
    while (this.i < this.input.length && this.input[this.i] !== '\n') this.i++
    return true
  }

  // <no-terminal>
  private readNonterminal(): boolean {
    if (this.input[this.i] !== '<') return false
    const start = this.i++
    let name = ''
    while (this.i < this.input.length && this.input[this.i] !== '>' && this.input[this.i] !== '\n') {
      name += this.input[this.i++]
    }
    if (this.input[this.i] !== '>') {
      throw new LexError('Se esperaba ">" para cerrar el no-terminal', this.line, this.col())
    }
    this.i++
    this.tokens.push({ kind: 'NONTERMINAL', value: name.trim(), line: this.line, col: start - this.lineStart + 1 })
    return true
  }

  // Terminal entre comillas "..." o '...'
  private readQuotedTerminal(): boolean {
    const quote = this.input[this.i]
    if (quote !== '"' && quote !== "'") return false
    const startCol = this.col()
    this.i++
    let value = ''
    while (this.i < this.input.length && this.input[this.i] !== quote) {
      if (this.input[this.i] === '\\') this.i++
      value += this.input[this.i++]
    }
    if (this.i >= this.input.length) {
      throw new LexError(`Terminal sin cerrar (falta ${quote})`, this.line, startCol)
    }
    this.i++ // comilla de cierre
    this.tokens.push({ kind: 'TERMINAL', value, line: this.line, col: startCol })
    return true
  }

  // ::= y =>
  private readMultiCharOperator(): boolean {
    if (this.input.slice(this.i, this.i + 3) === '::=') {
      this.push('PRODUCES', '::=')
      this.i += 3
      return true
    }
    if (this.input.slice(this.i, this.i + 2) === '=>') {
      this.push('ARROW', '=>')
      this.i += 2
      return true
    }
    return false
  }

  private readPunctuation(): boolean {
    const kind = PUNCTUATION[this.input[this.i]]
    if (!kind) return false
    this.push(kind, this.input[this.i])
    this.i++
    return true
  }

  // Identificador simple (nombres de variante o keywords sin comillas)
  // Incluye ? y - para que nombres como empty?-prim sean un solo token
  private readIdent(): boolean {
    if (!/[a-zA-Z_]/.test(this.input[this.i])) return false
    const startCol = this.col()
    let value = ''
    while (this.i < this.input.length && /[a-zA-Z0-9_\-?]/.test(this.input[this.i])) {
      value += this.input[this.i++]
    }
    this.tokens.push({ kind: 'IDENT', value, line: this.line, col: startCol })
    return true
  }

  private readonly matchers: Array<() => boolean> = [
    () => this.skipNewline(),
    () => this.skipWhitespace(),
    () => this.skipComment(),
    () => this.readNonterminal(),
    () => this.readQuotedTerminal(),
    () => this.readMultiCharOperator(),
    () => this.readPunctuation(),
    () => this.readIdent(),
  ]

  tokenize(): Token[] {
    while (this.i < this.input.length) {
      const matched = this.matchers.some((match) => match())
      if (!matched) this.i++ // Ignorar caracteres desconocidos
    }

    this.tokens.push({ kind: 'EOF', value: '', line: this.line, col: this.col() })
    return this.tokens
  }
}

export function tokenize(input: string): Token[] {
  return new Lexer(input).tokenize()
}
