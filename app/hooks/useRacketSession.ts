'use client'

import { useState, useCallback, useRef } from 'react'
import type { ASTNode } from '@/app/types/ast'
import type { EnvFrame } from '@/app/types/environment'
import type { EditorFileLike, StepResult } from '@/app/types/racket'
import { runTrace } from '@/app/services/racket'
import { classifyStepOutput } from '@/app/lib/step-format'
import { useConsoleLog } from './useConsoleLog'

export function useRacketSession() {
  const { logs, addLog, clearLog } = useConsoleLog()

  const [testInput, setTestInput] = useState('')
  const [ast, setAst] = useState<ASTNode | null>(null)
  const [frames, setFrames] = useState<EnvFrame[]>([])
  const [running, setRunning] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [pendingSteps, setPendingSteps] = useState<StepResult[]>([])

  const abortRef = useRef<AbortController | null>(null)

  const showStep = useCallback((step: StepResult) => {
    if (step.ast) setAst(step.ast)
    if (step.environments.length > 0) setFrames(step.environments)
    const { message, level } = classifyStepOutput(step.output)
    addLog(message, level)
  }, [addLog])

  const nextStep = useCallback(() => {
    if (pendingSteps.length === 0) return
    const [next, ...rest] = pendingSteps
    setPendingSteps(rest)
    showStep(next)
  }, [pendingSteps, showStep])

  const finishWithLastStep = useCallback((steps: StepResult[]) => {
    steps.forEach((step) => {
      const { message, level } = classifyStepOutput(step.output)
      addLog(message, level)
    })
    const last = steps.at(-1)
    if (last?.ast) setAst(last.ast)
    if (last && last.environments.length > 0) setFrames(last.environments)
  }, [addLog])

  const handleSteps = useCallback((steps: StepResult[]) => {
    if (stepMode && steps.length > 1) {
      const [first, ...rest] = steps
      showStep(first)
      setPendingSteps(rest)
      return
    }
    finishWithLastStep(steps)
  }, [stepMode, showStep, finishWithLastStep])

  const run = useCallback(async (files: EditorFileLike[]) => {
    if (running) return
    const expr = testInput.trim()
    if (!expr) {
      addLog('Escribe una expresión primero.', 'info')
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setPendingSteps([])
    addLog(expr, 'input')
    setTestInput('')

    try {
      const result = await runTrace(files, expr, controller.signal)

      if (result.stderr) {
        result.stderr.split('\n').filter(Boolean).forEach((line) => addLog(line, 'error'))
      } else if (result.steps.length > 0) {
        handleSteps(result.steps)
      }
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      if (!isAbort) {
        addLog('Error al conectar con el servidor de ejecución.', 'error')
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [testInput, running, addLog, handleSteps])

  const start = useCallback(() => setSessionActive(true), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setSessionActive(false)
    setTestInput('')
  }, [])

  const clear = useCallback(() => {
    clearLog()
    setAst(null)
    setFrames([])
  }, [clearLog])

  const toggleStepMode = useCallback(() => {
    setStepMode((m) => !m)
    setPendingSteps([])
  }, [])

  const resetForFileChange = useCallback(() => {
    abortRef.current?.abort()
    setSessionActive(false)
    setTestInput('')
    setAst(null)
    clearLog()
    setFrames([])
    setPendingSteps([])
  }, [clearLog])

  return {
    logs, testInput, setTestInput, ast, frames,
    running, sessionActive, stepMode, pendingSteps: pendingSteps.length,
    run, nextStep, start, stop, clear, toggleStepMode, resetForFileChange,
  }
}
