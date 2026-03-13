import type { AstNode, EvaluationStep } from '@/types'

export const initialEditorCode = `let x = 5;
let f = (y) => y + x;
f(-3);`

export const simulatedAst: AstNode = {
  type: 'Program',
  children: [
    { type: 'LetDeclaration', value: 'x = 5' },
    { type: 'LetDeclaration', value: 'f = (y) => y + x' },
    {
      type: 'CallExpression',
      value: 'f(-3)',
      children: [
        { type: 'Identifier', value: 'f' },
        { type: 'NumberLiteral', value: '-3' },
      ],
    },
  ],
}

export const simulatedEvaluationSteps: EvaluationStep[] = [
  {
    environment: {
      scopeName: 'global',
      entries: [
        { name: 'x', value: '5' },
        { name: 'f', value: 'closure' },
        { name: 'env', value: '{ x → 5 }' },
      ],
    },
    log: 'Evaluating expression',
  },
  {
    environment: {
      scopeName: 'call:f',
      parentScopeName: 'global',
      entries: [
        { name: 'x', value: '5' },
        { name: 'y', value: '-3' },
        { name: 'f', value: 'closure' },
        { name: 'env', value: '{ x → 5, y → -3 }' },
      ],
    },
    log: 'Stepping into closure body',
  },
  {
    environment: {
      scopeName: 'result',
      parentScopeName: 'call:f',
      entries: [
        { name: 'x', value: '5' },
        { name: 'y', value: '-3' },
        { name: 'result', value: '2' },
      ],
    },
    log: 'Result: 2',
  },
]

export const simulatedConsoleBoot = [
  'Parsing program...',
  'AST generated',
  'Evaluating expression',
  'Result: 2',
]