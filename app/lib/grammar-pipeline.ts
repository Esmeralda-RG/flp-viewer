import { tokenize, LexError } from './bnf-lexer'
import { parse, ParseError } from './bnf-parser'
import { generateGrammarRkt } from './eopl-generator'
import { generateEnvironmentRkt } from './env-generator'
import { generateMainRkt } from './main-generator'

export interface PipelineResult {
  grammarRkt: string
  environmentRkt: string
  mainRkt: string
  mainLockedLines: number[]
  errors: string[]
}

export function runPipeline(bnfInput: string): PipelineResult {
  const empty: PipelineResult = {
    grammarRkt: '', environmentRkt: '', mainRkt: '', mainLockedLines: [], errors: [],
  }

  if (!bnfInput.trim()) {
    return { ...empty, errors: ['La gramática está vacía.'] }
  }

  try {
    const tokens = tokenize(bnfInput)
    const ast = parse(tokens)

    if (ast.rules.length === 0) {
      return { ...empty, errors: ['No se encontraron reglas. Verifica el formato BNF.'] }
    }

    const grammarRkt = generateGrammarRkt(ast)
    const environmentRkt = generateEnvironmentRkt()
    const { content: mainRkt, lockedLines: mainLockedLines } = generateMainRkt(ast)

    return { grammarRkt, environmentRkt, mainRkt, mainLockedLines, errors: [] }
  } catch (err) {
    if (err instanceof LexError || err instanceof ParseError) {
      return { ...empty, errors: [err.message] }
    }
    return { ...empty, errors: [String(err)] }
  }
}
