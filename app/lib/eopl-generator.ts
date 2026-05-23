import type { GrammarAST, GrammarRule, Production, BNFItem } from './bnf-parser'

// Non-terminals that map directly to SLLGEN lexer primitives
const PRIMITIVES = new Set(['number', 'identifier', 'string', 'boolean', 'letter', 'digit'])

// Whitespace y comment siempre se auto-incluyen al inicio del lexical-spec
const AUTO_RULES = [
  '(whitespace (whitespace+) skip)',
  '(comment ("//" (arbno (not #\\newline))) skip)',
]

// Palabras clave que los estudiantes pueden usar en %lex
const LEX_KEYWORDS: Record<string, string[]> = {
  number: [
    '(decimal (digit+) number)',
    '(decimal ("-" digit+) number)',
  ],
  float: [
    '(float (digit (arbno digit) "." digit (arbno digit)) number)',
    '(float ("-" digit (arbno digit) "." digit (arbno digit)) number)',
  ],
  identifier: [
    '(identifier (letter (arbno (or letter digit "?"))) symbol)',
  ],
  binary: [
    '(binary ("b" (or "0" "1") (arbno (or "0" "1"))) string)',
    '(binary ("-" "b" (or "0" "1") (arbno (or "0" "1"))) string)',
  ],
  octal: [
    '(octal ("0x" (or "0" "1" "2" "3" "4" "5" "6" "7") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7"))) string)',
    '(octal ("-" "0x" (or "0" "1" "2" "3" "4" "5" "6" "7") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7"))) string)',
  ],
  hex: [
    '(hex ("hx" (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F"))) string)',
    '(hex ("-" "hx" (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F"))) string)',
  ],
  text: [
    '(text ("\\"" (arbno (not #\\"))) string)',
  ],
}

// Alias
LEX_KEYWORDS['string'] = LEX_KEYWORDS['text']

const DEFAULT_LEXICAL_RULES = [
  ...LEX_KEYWORDS['identifier'],
  ...LEX_KEYWORDS['binary'],
  ...LEX_KEYWORDS['number'],
  ...LEX_KEYWORDS['octal'],
  ...LEX_KEYWORDS['hex'],
  ...LEX_KEYWORDS['float'],
]

function expandLexRule(rule: string): string[] {
  if (rule.startsWith('(')) return [rule]
  const expanded = LEX_KEYWORDS[rule.toLowerCase()]
  return expanded ?? [`; %lex: palabra clave desconocida "${rule}"`]
}

function sym(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '')
}

function isPrimitive(name: string): boolean {
  return PRIMITIVES.has(name.toLowerCase())
}

function ntSym(name: string): string {
  return isPrimitive(name) ? name.toLowerCase() : sym(name)
}

function itemToSllgen(item: BNFItem): string {
  switch (item.kind) {
    case 'nonterminal':
      return ntSym(item.name)

    case 'terminal':
      return `"${item.value}"`

    case 'nonterminal-rep': {
      const s = ntSym(item.name)
      if (item.op === '*') return `(arbno ${s})`
      if (item.op === '+') return `${s} (arbno ${s})`
      // ? → optional: SLLGEN no tiene optional nativo, se expresa con dos variantes
      return `(arbno ${s}) ; opcional — considera dividir en dos variantes`
    }

    case 'group': {
      // Detect separated-list pattern: (A sep)* where sep is a terminal
      if (
        item.op === '*' &&
        item.items.length === 2 &&
        item.items[0].kind !== 'terminal' &&
        item.items[1].kind === 'terminal'
      ) {
        const elem = itemToSllgen(item.items[0])
        const sep = `"${(item.items[1]).value}"`
        return `(separated-list ${elem} ${sep})`
      }

      const inner = item.items.map(itemToSllgen).join(' ')
      if (!item.op) return inner          // bare group — just flatten
      if (item.op === '*') return `(arbno ${inner})`
      if (item.op === '+') return `${inner} (arbno ${inner})`
      return `(arbno ${inner}) ; opcional`
    }
  }
}

function autoVariantName(lhsSym: string, index: number, prod: Production): string {
  if (prod.variantName) return prod.variantName

  // EOPL convention: first production of program rule → a-program
  if (lhsSym === 'program' && index === 0) return 'a-program'

  // Try to build a name from the first terminal keyword
  const keyword = prod.items
    .filter((i): i is Extract<BNFItem, { kind: 'terminal' }> => i.kind === 'terminal')
    .map((i) => i.value.replace(/[^a-z0-9]/gi, ''))
    .find(Boolean)

  if (keyword) return `${lhsSym}-${keyword}-exp`

  // Fall back to numbered variant
  return index === 0 ? `${lhsSym}-exp` : `${lhsSym}-${index + 1}-exp`
}

function productionLine(lhsSym: string, prod: Production, index: number): string {
  const variantName = autoVariantName(lhsSym, index, prod)
  const items = prod.items.map(itemToSllgen).join(' ')
  return `    (${lhsSym} (${items}) ${variantName})`
}

export function generateGrammarRkt(ast: GrammarAST): string {
  const expanded = ast.lexicalRules.length > 0
    ? ast.lexicalRules.flatMap(expandLexRule)
    : DEFAULT_LEXICAL_RULES
  const lexRules = [...AUTO_RULES, ...expanded]
  const lexLines = lexRules.map(r => `    ${r}`).join('\n')

  const grammarLines = ast.rules.flatMap((rule: GrammarRule) => {
    const s = sym(rule.lhs)
    return rule.productions.map((prod, i) => productionLine(s, prod, i))
  })

  return String.raw`#lang eopl
;;; ============================================================
;;; grammar.rkt — Utilidades generadas por FLP Viewer
;;; Universidad del Valle — Intérprete Educativo
;;; ============================================================

(define lexical-spec
  '(
${lexLines}
  ))

(define grammar
  '(
${grammarLines.join('\n')}
  ))

(provide lexical-spec grammar)
`
}
