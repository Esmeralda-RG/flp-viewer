import { tokenize, LexError } from './bnf-lexer'
import { parse, ParseError } from './bnf-parser'
import { generateGrammarRkt, getLexErrors } from './eopl-generator'
import { generateEnvironmentRkt } from './env-generator'
import { generateMainRkt } from './main-generator'

import type { PipelineResult } from '@/app/types/grammar'
export type { PipelineResult }

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
