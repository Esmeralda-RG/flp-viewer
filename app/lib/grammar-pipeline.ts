import { tokenize, LexError } from './bnf-lexer'
import { parse, ParseError } from './bnf-parser'
import { generateGrammarRkt, getLexErrors } from './eopl-generator'
import { generateEnvironmentRkt } from './env-generator'
import { generateMainRkt } from './main-generator'
import { sym } from './grammar-naming'

import type { GrammarAST } from '@/app/types/bnf'
import type { PipelineResult } from '@/app/types/grammar'

// eval-program/eval-expression se generan solo si existe una regla con ese
// nombre (o el sinónimo expr) — pero el encabezado fijo de main.rkt siempre
// las referencia. Sin esto, el pipeline no reporta error y el .rkt generado
// falla recién al cargarlo en Racket: "eval-program: unbound identifier".
function structuralErrors(ast: GrammarAST): string[] {
  const ruleNames = new Set(ast.rules.map((r) => sym(r.lhs)))
  const errors: string[] = []
  if (!ruleNames.has('program')) {
    errors.push('Falta una regla <program> — es el punto de entrada que el intérprete llama al ejecutar (genera eval-program).')
  }
  if (!ruleNames.has('expression') && !ruleNames.has('expr')) {
    errors.push('Falta una regla <expression> o <expr> — eval-program siempre evalúa el cuerpo del programa llamando a eval-expression.')
  }
  return errors
}

export function runPipeline(lexInput: string, grammarInput: string): PipelineResult {
  const empty: PipelineResult = {
    grammarRkt: '', environmentRkt: '', mainRkt: '', mainLockedLines: [], errors: [],
  }

  if (!grammarInput.trim()) {
    return { ...empty, errors: ['La gramática está vacía.'] }
  }

  try {
    const tokens = tokenize(grammarInput)
    const ast = parse(tokens)

    if (ast.rules.length === 0) {
      return { ...empty, errors: ['No se encontraron reglas. Verifica el formato BNF.'] }
    }

    const missingRules = structuralErrors(ast)
    if (missingRules.length > 0) {
      return { ...empty, errors: missingRules }
    }

    const grammarRkt = generateGrammarRkt(ast, lexInput)
    const environmentRkt = generateEnvironmentRkt()
    const { content: mainRkt, lockedLines: mainLockedLines } = generateMainRkt(ast)

    const lexErrors = getLexErrors(lexInput)
    return { grammarRkt, environmentRkt, mainRkt, mainLockedLines, errors: lexErrors }
  } catch (err) {
    if (err instanceof LexError || err instanceof ParseError) {
      return { ...empty, errors: [err.message] }
    }
    return { ...empty, errors: [String(err)] }
  }
}
