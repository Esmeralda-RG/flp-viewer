import type { GrammarAST, GrammarRule, Production, BNFItem } from './bnf-parser'

// ─── helpers (mirror eopl-generator) ─────────────────────────────────────────

function sym(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '')
}

function autoVariantName(lhsSym: string, index: number, prod: Production): string {
  if (prod.variantName) return prod.variantName
  // EOPL convention: first production of program rule → a-program
  if (lhsSym === 'program' && index === 0) return 'a-program'
  const keyword = prod.items
    .filter((i): i is Extract<BNFItem, { kind: 'terminal' }> => i.kind === 'terminal')
    .map((i) => i.value.replace(/[^a-z0-9]/gi, ''))
    .find(Boolean)
  if (keyword) return `${lhsSym}-${keyword}-exp`
  return index === 0 ? `${lhsSym}-exp` : `${lhsSym}-${index + 1}-exp`
}

// ─── field name inference ─────────────────────────────────────────────────────

const FIELD_BASE: Record<string, string> = {
  number: 'n', identifier: 'id', string: 's', boolean: 'b',
  letter: 'c', digit: 'd',
  expression: 'expr', expr: 'expr',
  program: 'pgm', primitive: 'prim',
  statement: 'stmt', declaration: 'decl',
  definition: 'def', type: 'ty',
}

function fieldBase(name: string): string {
  const lower = name.toLowerCase()
  if (FIELD_BASE[lower]) return FIELD_BASE[lower]
  const s = sym(name).replace(/-exp$/, '').replaceAll('-', '').slice(0, 4)
  return s || 'x'
}

function collectFields(items: BNFItem[]): string[] {
  const counts = new Map<string, number>()

  function nextName(base: string, plural = false): string {
    const c = counts.get(base) ?? 0
    counts.set(base, c + 1)
    const name = plural ? `${base}s` : base
    return c === 0 ? name : `${name}${c + 1}`
  }

  const fields: string[] = []
  for (const item of items) {
    switch (item.kind) {
      case 'terminal': break
      case 'nonterminal':
        fields.push(nextName(fieldBase(item.name)))
        break
      case 'nonterminal-rep':
        fields.push(nextName(fieldBase(item.name), true))
        break
      case 'group':
        if (item.op) {
          fields.push(nextName('items'))
        } else {
          fields.push(...collectFields(item.items))
        }
        break
    }
  }
  return fields
}

// ─── rule classification ──────────────────────────────────────────────────────

type RuleKind = 'program' | 'expression' | 'primitive' | 'other'

function ruleKind(rule: GrammarRule): RuleKind {
  const s = sym(rule.lhs)
  if (s === 'program') return 'program'
  if (s === 'expression' || s === 'expr') return 'expression'
  if (s === 'primitive' || s === 'prim') return 'primitive'
  return 'other'
}

function paramName(lhs: string): string {
  const s = sym(lhs)
  const MAP: Record<string, string> = {
    program: 'pgm', expression: 'exp', expr: 'exp',
    primitive: 'prim', statement: 'stmt', declaration: 'decl',
  }
  if (MAP[s]) return MAP[s]
  const abbr = s.replaceAll('-', '').slice(0, 4)
  return abbr === s ? `a${abbr}` : abbr
}

function lambdaParams(kind: RuleKind, lhs: string): string {
  if (kind === 'program') return paramName(lhs)
  if (kind === 'primitive') return `${paramName(lhs)} args`
  return `${paramName(lhs)} env`
}

function fnName(kind: RuleKind, lhs: string): string {
  if (kind === 'program') return 'eval-program'
  if (kind === 'expression') return 'eval-expression'
  if (kind === 'primitive') return 'apply-primitive'
  return `eval-${sym(lhs)}`
}

function fnComment(kind: RuleKind, fn: string, lhs: string): string {
  if (kind === 'program') return `; ${fn}: <${lhs}> -> valor`
  if (kind === 'primitive') return `; ${fn}: <${lhs}> <args> -> valor`
  return `; ${fn}: <${lhs}> <environment> -> valor`
}

import type { MainGeneratorResult } from '@/app/types/grammar'
export type { MainGeneratorResult }

// ─── builder ──────────────────────────────────────────────────────────────────

export function generateMainRkt(ast: GrammarAST): MainGeneratorResult {
  const out: { text: string; locked: boolean }[] = []

  function L(text: string) { out.push({ text, locked: true }) }
  function U(text: string) { out.push({ text, locked: false }) }

  // ── boilerplate header ────────────────────────────────────────────────────
  L('#lang eopl')
  L('(provide (all-defined-out))')
  L('')
  L('(require "grammar.rkt")')
  L('(require "environment.rkt")')
  L('(require "utils.rkt")')
  L('')
  L('(sllgen:make-define-datatypes lexical-spec grammar)')
  L('')
  L('(define show-the-datatypes')
  L('  (lambda () (sllgen:list-define-datatypes lexical-spec grammar)))')
  L('')
  L('; Front-end: análisis léxico (scanner) y sintáctico (parser)')
  L('(define scan&parse')
  L('  (sllgen:make-string-parser lexical-spec grammar))')
  L('')
  L('; Intérprete: front-end + evaluación + señal de lectura')
  L('(define interpreter')
  L('  (sllgen:make-rep-loop "--> "')
  L('    (lambda (pgm) (eval-program pgm))')
  L('    (sllgen:make-stream-parser')
  L('      lexical-spec')
  L('      grammar)))')
  L('')

  // ── eval / apply functions per rule ──────────────────────────────────────
  for (const rule of ast.rules) {
    const lhs = sym(rule.lhs)
    const kind = ruleKind(rule)
    const fn = fnName(kind, lhs)
    const lparams = lambdaParams(kind, lhs)
    const subjectParam = lparams.split(' ')[0]

    L(fnComment(kind, fn, lhs))
    L(`(define ${fn}`)
    L(`  (lambda (${lparams})`)
    L(`    (cases ${lhs} ${subjectParam}`)

    for (let i = 0; i < rule.productions.length; i++) {
      const prod = rule.productions[i]
      const variant = autoVariantName(lhs, i, prod)
      const fields = collectFields(prod.items)
      const fieldStr = fields.length > 0 ? fields.join(' ') : ''

      L(`      (${variant} (${fieldStr})`)
      if (kind === 'program' && fields.length > 0) {
        const bodyField = fields.at(-1)
        L(`        (eval-expression ${bodyField} (init-env)))`)
      } else {
        U(`        ;; TODO: implement ${variant}`)
        U(`        (error "TODO: implement ${variant}"))`)
      }
    }

    L(`      )))`)
    L('')
  }

  // Remove trailing blank line then add commented interpreter call
  while (out.length > 0 && out.at(-1)?.text === '') out.pop()
  out.push({ text: '', locked: true }, { text: '; (interpreter) ; descomentar para iniciar el REPL', locked: true })

  const lines = out.map((l) => l.text)
  const lockedLines: number[] = []
  out.forEach((l, i) => { if (l.locked) lockedLines.push(i + 1) })

  return { content: lines.join('\n'), lockedLines }
}
