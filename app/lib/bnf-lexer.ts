export type TokenKind =
  | 'NONTERMINAL'   // <name>
  | 'TERMINAL'      // "..." or '...'
  | 'PRODUCES'      // ::=
  | 'ALT'           // |
  | 'LPAREN'        // (
  | 'RPAREN'        // )
  | 'STAR'          // *
  | 'PLUS'          // +
  | 'QUESTION'      // ?
  | 'ARROW'         // =>
  | 'IDENT'         // bare word (variant names or unquoted non-terminals)
  | 'LEX_DIRECTIVE' // %lex (raw SLLGEN lexical rule)
  | 'EOF'

export interface Token {
  kind: TokenKind
  value: string
  line: number
  col: number
}

export class LexError extends Error {
  constructor(message: string, public line: number, public col: number) {
    super(`[Línea ${line}:${col}] ${message}`)
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let line = 1
  let lineStart = 0

  const col = () => i - lineStart + 1
  const push = (kind: TokenKind, value: string) => tokens.push({ kind, value, line, col: col() - value.length })

  while (i < input.length) {
    const ch = input[i]

    // Newline — track line numbers
    if (ch === '\n') { line++; lineStart = ++i; continue }

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue }

    // %lex directive — rest of line is a raw SLLGEN lexical rule
    if (ch === '%' && input.slice(i, i + 4) === '%lex') {
      const startCol = col()
      i += 4
      while (i < input.length && (input[i] === ' ' || input[i] === '\t')) i++
      let raw = ''
      while (i < input.length && input[i] !== '\n') raw += input[i++]
      tokens.push({ kind: 'LEX_DIRECTIVE', value: raw.trim(), line, col: startCol })
      continue
    }

    // Line comments: ; // #
    if (ch === ';' || (ch === '/' && input[i + 1] === '/') || ch === '#') {
      while (i < input.length && input[i] !== '\n') i++
      continue
    }

    // <nonterminal>
    if (ch === '<') {
      const start = i++
      let name = ''
      while (i < input.length && input[i] !== '>' && input[i] !== '\n') name += input[i++]
      if (input[i] !== '>') throw new LexError('Se esperaba ">" para cerrar el no-terminal', line, col())
      i++
      tokens.push({ kind: 'NONTERMINAL', value: name.trim(), line, col: start - lineStart + 1 })
      continue
    }

    // Quoted terminal "..." or '...'
    if (ch === '"' || ch === "'") {
      const quote = ch
      const startCol = col()
      i++
      let value = ''
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\') i++
        value += input[i++]
      }
      if (i >= input.length) throw new LexError(`Terminal sin cerrar (falta ${quote})`, line, startCol)
      i++ // closing quote
      tokens.push({ kind: 'TERMINAL', value, line, col: startCol })
      continue
    }

    // ::=
    if (input.slice(i, i + 3) === '::=') {
      push('PRODUCES', '::='); i += 3; continue
    }

    // =>
    if (input.slice(i, i + 2) === '=>') {
      push('ARROW', '=>'); i += 2; continue
    }

    // Single-char tokens
    if (ch === '|') { push('ALT', ch); i++; continue }
    if (ch === '(') { push('LPAREN', ch); i++; continue }
    if (ch === ')') { push('RPAREN', ch); i++; continue }
    if (ch === '*') { push('STAR', ch); i++; continue }
    if (ch === '+') { push('PLUS', ch); i++; continue }
    if (ch === '?') { push('QUESTION', ch); i++; continue }

    // Bare identifier (variant names, or unquoted keywords/primitives)
    if (/[a-zA-Z_]/.test(ch)) {
      const startCol = col()
      let value = ''
      while (i < input.length && /[a-zA-Z0-9_-]/.test(input[i])) value += input[i++]
      tokens.push({ kind: 'IDENT', value, line, col: startCol })
      continue
    }

    // Skip unknown characters silently
    i++
  }

  tokens.push({ kind: 'EOF', value: '', line, col: col() })
  return tokens
}
