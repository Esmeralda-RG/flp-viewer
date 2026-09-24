import type { GrammarAST, GrammarRule, Production, BNFItem, GroupItem } from '@/app/types/bnf'
import { sym, autoVariantName } from './grammar-naming'

// Non-terminals that map directly to SLLGEN lexer primitives
const PRIMITIVES = new Set(['number', 'identifier', 'string', 'boolean', 'letter', 'digit'])

// Whitespace y comment se auto-incluyen al inicio del lexical-spec salvo que
// el estudiante escriba su propia regla sllgen para ese token (p. ej. pegar
// (comment ("%" (arbno (not #\newline))) skip) tal como lo usa el curso).
const AUTO_RULES: Record<'whitespace' | 'comment', string> = {
  whitespace: '(whitespace (whitespace) skip)',
  comment: String.raw`(comment ("%" (arbno (not #\newline))) skip)`,
}

// Palabras clave que los estudiantes pueden usar en %lex
const LEX_KEYWORDS: Record<string, string[]> = {
  number: [
    '(number (digit (arbno digit)) number)',
    '(number ("-" digit (arbno digit)) number)',
  ],
  float: [
    '(float (digit (arbno digit) "." digit (arbno digit)) number)',
    '(float ("-" digit (arbno digit) "." digit (arbno digit)) number)',
  ],
  identifier: [
    // $ es un carácter de símbolo normal en Racket/EOPL (sin restricción de
    // posición); solo exigíamos letra al inicio por elección propia. Se
    // permite también $ como primer carácter — ver conversación con el
    // profesor del curso.
    '(identifier ((or letter "$") (arbno (or letter digit "?" "$"))) symbol)',
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
    String.raw`(text ("\"" (arbno (not #\")) "\"") string)`,
  ],
}

// Alias
LEX_KEYWORDS['string'] = LEX_KEYWORDS['text']

// En el modo default los floats también producen token "number" para que
// <number> en el BNF capture enteros y decimales sin distinción.
const DEFAULT_FLOAT_AS_NUMBER = [
  '(number (digit (arbno digit) "." digit (arbno digit)) number)',
  '(number ("-" digit (arbno digit) "." digit (arbno digit)) number)',
]

const DEFAULT_LEXICAL_RULES = [
  ...LEX_KEYWORDS['identifier'],
  ...LEX_KEYWORDS['binary'],
  ...LEX_KEYWORDS['number'],
  ...DEFAULT_FLOAT_AS_NUMBER,
  ...LEX_KEYWORDS['octal'],
  ...LEX_KEYWORDS['hex'],
]

function expandLexRule(rule: string): string[] {
  if (rule.startsWith('(')) return [rule]
  const expanded = LEX_KEYWORDS[rule.toLowerCase()]
  return expanded ?? [`; ⚠ "${rule}" — falta implementar: (${rule} (...) tipo)`]
}

export function getLexErrors(lexInput: string): string[] {
  return lexInput
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(';') && !l.startsWith('('))
    .filter((l) => !LEX_KEYWORDS[l.toLowerCase()])
    .map((l) => `Token sin implementar: "${l}" — escribe la regla sllgen: (${l} (...) tipo)`)
}

function isPrimitive(name: string): boolean {
  return PRIMITIVES.has(name.toLowerCase())
}

function ntSym(name: string): string {
  return isPrimitive(name) ? name.toLowerCase() : sym(name)
}

function escapeSllgenTerminal(raw: string): string {
  // In sllgen, terminals are Racket strings — escape backslash and double-quote
  return raw.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`)
}

function terminalToSllgen(value: string): string {
  return `"${escapeSllgenTerminal(value)}"`
}

// Detect: [<A> ("sep" <A>)*]  →  (separated-list A sep)
// This is the correct EBNF notation for separated lists
function separatedListFromOptionalGroup(item: GroupItem): string | null {
  if (item.op !== '?' || item.items.length !== 2) return null
  const [elem, inner] = item.items
  if (elem.kind === 'terminal' || inner.kind !== 'group') return null
  if (inner.op !== '*' || inner.items.length !== 2) return null

  const [sep, rep] = inner.items
  if (sep.kind !== 'terminal' || rep.kind === 'terminal') return null

  return `(separated-list ${itemToSllgen(elem)} ${terminalToSllgen(sep.value)})`
}

// Legacy shorthand: (A sep)* — kept for backward compatibility
function separatedListShorthand(item: GroupItem): string | null {
  if (item.op !== '*' || item.items.length !== 2) return null
  const [elem, sep] = item.items
  if (elem.kind === 'terminal' || sep.kind !== 'terminal') return null

  return `(separated-list ${itemToSllgen(elem)} ${terminalToSllgen(sep.value)})`
}

function flattenGroup(item: GroupItem): string {
  const inner = item.items.map(itemToSllgen).join(' ')
  if (!item.op) return inner          // bare group — just flatten
  if (item.op === '*') return `(arbno ${inner})`
  if (item.op === '+') return `${inner} (arbno ${inner})`
  return `(arbno ${inner}) ; opcional`
}

function groupToSllgen(item: GroupItem): string {
  return separatedListFromOptionalGroup(item) ?? separatedListShorthand(item) ?? flattenGroup(item)
}

// Un grupo repetido que SLLGEN compila a `(separated-list elem sep)` produce
// un único campo (lista de `elem`) en el datatype real, a diferencia de un
// `arbno` genérico multi-símbolo — ver collectFields en main-generator.ts
export function isSeparatedListGroup(item: GroupItem): boolean {
  return separatedListFromOptionalGroup(item) !== null || separatedListShorthand(item) !== null
}

function itemToSllgen(item: BNFItem): string {
  switch (item.kind) {
    case 'nonterminal':
      return ntSym(item.name)

    case 'terminal':
      return terminalToSllgen(item.value)

    case 'nonterminal-rep': {
      const s = ntSym(item.name)
      if (item.op === '*') return `(arbno ${s})`
      if (item.op === '+') return `${s} (arbno ${s})`
      // ? → optional: SLLGEN no tiene optional nativo, se expresa con dos variantes
      return `(arbno ${s}) ; opcional — considera dividir en dos variantes`
    }

    case 'group':
      return groupToSllgen(item)
  }
}

function productionLine(lhsSym: string, prod: Production, index: number): string {
  const variantName = autoVariantName(lhsSym, index, prod)
  const items = prod.items.map(itemToSllgen).join(' ')
  return `    (${lhsSym} (${items}) ${variantName})`
}

// Nombre del token que define una regla sllgen cruda, p. ej. "comment" en
// (comment ("%" (arbno (not #\newline))) skip)
function ruleTokenName(rule: string): string | null {
  const match = /^\(\s*([\w?-]+)/.exec(rule)
  return match ? match[1].toLowerCase() : null
}

function parseLexInput(lexInput: string): string[] {
  const keywords = lexInput
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(';'))
  const expanded = keywords.length > 0
    ? keywords.flatMap(expandLexRule)
    : DEFAULT_LEXICAL_RULES
  const overridden = new Set(expanded.map(ruleTokenName))
  const autoRules = (Object.keys(AUTO_RULES) as (keyof typeof AUTO_RULES)[])
    .filter((name) => !overridden.has(name))
    .map((name) => AUTO_RULES[name])
  return [...autoRules, ...expanded]
}

export function generateGrammarRkt(ast: GrammarAST, lexInput: string): string {
  const lexRules = parseLexInput(lexInput)
  const lexLines = lexRules.map(r => `    ${r}`).join('\n')

  const grammarLines = ast.rules.flatMap((rule: GrammarRule) => {
    const s = sym(rule.lhs)
    return rule.productions.map((prod, i) => productionLine(s, prod, i))
  })

  return `#lang eopl
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
