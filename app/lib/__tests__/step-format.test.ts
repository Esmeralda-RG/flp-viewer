import { describe, it, expect } from 'vitest'
import { classifyStepOutput } from '../step-format'

describe('classifyStepOutput', () => {
  it('treats null as void', () => {
    expect(classifyStepOutput(null)).toEqual({ message: 'void', level: 'info' })
  })

  it('treats the string "void" as void', () => {
    expect(classifyStepOutput('"void"')).toEqual({ message: 'void', level: 'info' })
  })

  it('treats "null" as void', () => {
    expect(classifyStepOutput('null')).toEqual({ message: 'void', level: 'info' })
  })

  it('extracts an error message wrapped in ✕ markers', () => {
    expect(classifyStepOutput('"✕ boom"')).toEqual({ message: 'boom', level: 'error' })
  })

  it('treats regular output as output level', () => {
    expect(classifyStepOutput('42')).toEqual({ message: '42', level: 'output' })
  })
})
