import type { Token, TokenKind, BNFItem, Production, GrammarRule, GrammarAST } from '@/app/types/bnf'

// ---------------------------------------------------------------------------
// Analizador sintáctico
// ---------------------------------------------------------------------------

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(`[Línea ${token.line}:${token.col}] ${message} (encontrado: "${token.value}" [${token.kind}])`)
  }
}

export function parse(tokens: Token[]): GrammarAST {
  let pos = 0

  const peek = (): Token => tokens[pos]
  const peek2 = (): Token => tokens[pos + 1] ?? tokens.at(-1)

  function check(kind: TokenKind): boolean {
    return peek().kind === kind
  }

  function consume(kind?: TokenKind): Token {
    const tok = tokens[pos++]
    if (kind && tok.kind !== kind) {
      throw new ParseError(`Se esperaba ${kind}`, tok)
    }
    return tok
  }

  function parseOp(): '*' | '+' | '?' | null {
    if (check('STAR')) { consume(); return '*' }
    if (check('PLUS')) { consume(); return '+' }
    if (check('QUESTION')) { consume(); return '?' }
    return null
  }

  function isProductionEnd(): boolean {
    const k = peek().kind
    if (k === 'EOF' || k === 'ALT' || k === 'ARROW') return true
    // Inicio de nueva regla: NO-TERMINAL ::= o IDENT ::=
    if ((k === 'NONTERMINAL' || k === 'IDENT') && peek2().kind === 'PRODUCES') return true
    return false
  }

  function parseItem(): BNFItem {
    if (check('NONTERMINAL')) {
      const name = consume('NONTERMINAL').value
      const op = parseOp()
      if (op) return { kind: 'nonterminal-rep', name, op }
      return { kind: 'nonterminal', name }
    }

    if (check('IDENT')) {
      // Los identificadores simples se tratan como referencias a no-terminales
      const name = consume('IDENT').value
      const op = parseOp()
      if (op) return { kind: 'nonterminal-rep', name, op }
      return { kind: 'nonterminal', name }
    }

    if (check('TERMINAL')) {
      const value = consume('TERMINAL').value
      const op = parseOp()
      if (op) return { kind: 'group', items: [{ kind: 'terminal', value }], op }
      return { kind: 'terminal', value }
    }

    if (check('LPAREN')) {
      consume('LPAREN')
      const items: BNFItem[] = []
      while (!check('RPAREN') && !check('EOF')) {
        items.push(parseItem())
      }
      if (!check('RPAREN')) throw new ParseError('Se esperaba ")" para cerrar el grupo', peek())
      consume('RPAREN')
      const op = parseOp()
      return { kind: 'group', items, op }
    }

    // [...] es azúcar para (...)?
    if (check('LBRACKET')) {
      consume('LBRACKET')
      const items: BNFItem[] = []
      while (!check('RBRACKET') && !check('EOF')) {
        items.push(parseItem())
      }
      if (!check('RBRACKET')) throw new ParseError('Se esperaba "]" para cerrar el grupo opcional', peek())
      consume('RBRACKET')
      return { kind: 'group', items, op: '?' }
    }

    throw new ParseError('Se esperaba un elemento de producción', peek())
  }

  function parseProduction(): Production {
    const items: BNFItem[] = []
    while (!isProductionEnd()) {
      items.push(parseItem())
    }

    let variantName: string | null = null
    if (check('ARROW')) {
      consume('ARROW')
      if (!check('IDENT')) throw new ParseError('Se esperaba el nombre de la variante después de =>', peek())
      variantName = consume('IDENT').value
    }

    return { items, variantName }
  }

  function parseAlternatives(): Production[] {
    const prods: Production[] = [parseProduction()]
    while (check('ALT')) {
      consume('ALT')
      prods.push(parseProduction())
    }
    return prods
  }

  function parseRule(): GrammarRule {
    // Acepta tanto <no-terminal> ::= como ident-simple ::=
    let lhs: string
    if (check('NONTERMINAL')) lhs = consume('NONTERMINAL').value
    else if (check('IDENT')) lhs = consume('IDENT').value
    else throw new ParseError('Se esperaba un no-terminal al inicio de la regla', peek())

    consume('PRODUCES')
    const productions = parseAlternatives()
    return { lhs, productions }
  }

  const rules: GrammarRule[] = []
  while (!check('EOF')) {
    rules.push(parseRule())
  }

  return { rules }
}
