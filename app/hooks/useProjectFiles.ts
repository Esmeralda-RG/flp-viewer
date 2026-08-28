'use client'

import { useState, useCallback } from 'react'
import type { EditorFile, GeneratedGrammarFiles } from '@/app/types/editor'
import type { Example } from '@/app/types/examples'
import type { InitBinding } from '@/app/types/grammar'
import { parseInitEnv, updateInitEnvInContent } from '@/app/lib/init-env-utils'
import { INITIAL_FILES, downloadZip, upsertFile } from '@/app/lib/playground-utils'

export function useProjectFiles(examples: Example[]) {
  const defaultExample = examples.find((e) => e.id === 'hola-mundo')
  const [files, setFiles] = useState<EditorFile[]>(
    defaultExample?.files?.map((f) => ({ ...f, revision: 0 })) ?? INITIAL_FILES
  )
  const [activeFileId, setActiveFileId] = useState(defaultExample?.activeFileId ?? 'main')

  const updateFile = useCallback((id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)))
  }, [])

  const loadExample = useCallback((example: Example) => {
    if (example.files) {
      setFiles((prev) => {
        const revMap = new Map(prev.map((f) => [f.id, f.revision]))
        return example.files!.map((f) => ({
          ...f,
          revision: (revMap.get(f.id) ?? -1) + 1,
        }))
      })
      setActiveFileId(example.activeFileId ?? example.files[0].id)
    } else {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === 'main'
            ? { ...f, revision: f.revision + 1, content: example.code, lockedLines: example.lockedLines }
            : f,
        ),
      )
      setActiveFileId('main')
    }
  }, [])

  const applyGeneratedGrammar = useCallback((generated: GeneratedGrammarFiles) => {
    setFiles((prev) => {
      let next = upsertFile(prev, 'grammar-input', 'grammar-input.bnf', generated.input, 'plaintext')
      next = upsertFile(next, 'grammar-rkt', 'grammar.rkt', generated.grammarRkt, 'scheme')
      next = upsertFile(next, 'environment-rkt', 'environment.rkt', generated.environmentRkt, 'scheme')
      next = upsertFile(next, 'main', 'main.rkt', generated.mainRkt, 'scheme', generated.mainLockedLines)
      return next
    })
    setActiveFileId('main')
  }, [])

  const getInitEnvBindings = useCallback((): InitBinding[] => {
    const envFile = files.find((f) => f.name === 'environment.rkt')
    return envFile ? parseInitEnv(envFile.content) : []
  }, [files])

  const applyInitEnv = useCallback((bindings: InitBinding[]) => {
    setFiles((prev) => {
      const ef = prev.find((f) => f.name === 'environment.rkt')
      if (!ef) return prev
      const newContent = updateInitEnvInContent(ef.content, bindings)
      return prev.map((f) =>
        f.id === ef.id ? { ...f, content: newContent, revision: f.revision + 1 } : f
      )
    })
  }, [])

  const download = useCallback(() => {
    downloadZip(files)
  }, [files])

  return {
    files, activeFileId, setActiveFileId, updateFile,
    loadExample, applyGeneratedGrammar, getInitEnvBindings, applyInitEnv, download,
  }
}
