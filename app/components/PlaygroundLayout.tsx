'use client'

import { useState, useCallback, useRef } from 'react'
import { Panel, Group, Separator } from 'react-resizable-panels'
import JSZip from 'jszip'
import Navbar from './Navbar'
import type { Example } from '@/app/types/examples'
import EditorPanel, { type EditorFile } from './EditorPanel'
import ASTViewer, { type ASTNode } from './ASTViewer'
import ConsoleOutput, { type LogEntry } from './ConsoleOutput'
import EnvironmentPanel, { type EnvFrame } from './EnvironmentPanel'
import GrammarModal, { type GeneratedGrammarFiles } from './GrammarModal'
import WelcomeModal from './WelcomeModal'
import InitEnvModal from './InitEnvModal'
import HelpDrawer from './HelpDrawer'
import { runTrace, type StepResult } from '@/app/services/racket'
import { generateUtilsRkt } from '@/app/lib/utils-generator'
import { parseInitEnv, updateInitEnvInContent, type InitBinding } from '@/app/lib/init-env-utils'
import type { HelpSection } from '@/app/types/help'

const INITIAL_CODE = `; intérprete simple — escribe tu código aquí
`

const INITIAL_FILES: EditorFile[] = [
  {
    id: 'main',
    revision: 0,
    name: 'main.rkt',
    content: INITIAL_CODE,
    language: 'scheme',
    lockedLines: [],
  },
  {
    id: 'utils',
    revision: 0,
    name: 'utils.rkt',
    content: generateUtilsRkt(),
    language: 'scheme',
  },
]

function ResizeBar({ className }: Readonly<{ className?: string }>) {
  return (
    <Separator
      className={[
        'bg-[#3c3c3c] hover:bg-blue-500 transition-colors shrink-0',
        className,
      ].join(' ')}
    />
  )
}

function prepareForDownload(file: EditorFile): EditorFile {
  if (file.name !== 'main.rkt') return file
  const content = file.content.replace(/^; \(interpreter\)(.*)$/m, '(interpreter)$1')
  return { ...file, content }
}

async function downloadZip(files: EditorFile[], zipName = 'flp-project.zip') {
  const zip = new JSZip()
  for (const f of files) {
    const prepared = prepareForDownload(f)
    zip.file(prepared.name, prepared.content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  URL.revokeObjectURL(url)
}

function upsertFile(
  prev: EditorFile[],
  id: string,
  name: string,
  content: string,
  language: string,
  lockedLines?: number[],
): EditorFile[] {
  const next = [...prev]
  const idx = next.findIndex((f) => f.id === id)
  if (idx >= 0) {
    next[idx] = { ...next[idx], revision: next[idx].revision + 1, content, name, lockedLines }
  } else {
    next.push({ id, revision: 0, name, content, language, lockedLines })
  }
  return next
}

function createInitEnvModalElement(
  files: EditorFile[],
  onClose: () => void,
  onApply: (bindings: InitBinding[]) => void,
) {
  const envFile = files.find((f) => f.name === 'environment.rkt')
  const currentBindings = envFile ? parseInitEnv(envFile.content) : []

  return (
    <InitEnvModal
      bindings={currentBindings}
      onClose={onClose}
      onApply={onApply}
    />
  )
}

export default function PlaygroundLayout({ examples, helpSections }: Readonly<{ examples: Example[]; helpSections: HelpSection[] }>) {
  const defaultExample = examples.find((e) => e.id === 'hola-mundo')
  const [files, setFiles] = useState<EditorFile[]>(
    defaultExample?.files?.map((f) => ({ ...f, revision: 0 })) ?? INITIAL_FILES
  )
  const [activeFileId, setActiveFileId] = useState(defaultExample?.activeFileId ?? 'main')
  const [grammarModalOpen, setGrammarModalOpen] = useState(false)
  const [initEnvModalOpen, setInitEnvModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [testInput, setTestInput] = useState('')

  const [ast, setAst] = useState<ASTNode | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [frames, setFrames] = useState<EnvFrame[]>([])
  const [running, setRunning] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [pendingSteps, setPendingSteps] = useState<StepResult[]>([])

  const abortRef = useRef<AbortController | null>(null)

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'output') => {
    setLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), level, message, timestamp: Date.now() },
    ])
  }, [])

  const showStep = useCallback((step: StepResult) => {
    if (step.ast) setAst(step.ast)
    if (step.environments.length > 0) setFrames(step.environments)
    if (step.output !== null && step.output !== '"void"' && step.output !== 'null') {
      addLog(step.output, 'output')
    } else {
      addLog('void', 'info')
    }
  }, [addLog])

  const handleNextStep = useCallback(() => {
    if (pendingSteps.length === 0) return
    const [next, ...rest] = pendingSteps
    setPendingSteps(rest)
    showStep(next)
  }, [pendingSteps, showStep])

  const handleRun = useCallback(async () => {
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
      const result = await runTrace(
        files.map((f) => ({ name: f.name, content: f.content })),
        expr,
        controller.signal,
      )

      if (result.stderr) {
        result.stderr.split('\n').filter(Boolean).forEach((line) => addLog(line, 'error'))
      } else if (result.steps.length > 0) {
        if (stepMode && result.steps.length > 1) {
          const [first, ...rest] = result.steps
          showStep(first)
          setPendingSteps(rest)
        } else {
          result.steps.forEach((step) => {
            if (step.output !== null && step.output !== '"void"' && step.output !== 'null') {
              addLog(step.output, 'output')
            } else {
              addLog('void', 'info')
            }
          })
          const last = result.steps.at(-1)
          if (last) {
          if (last.ast) setAst(last.ast)
          if (last.environments.length > 0) setFrames(last.environments)
          }
        }
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
  }, [files, testInput, running, stepMode, addLog, showStep])

  const handleStartSession = useCallback(() => {
    setSessionActive(true)
  }, [])

  const handleStopSession = useCallback(() => {
    abortRef.current?.abort()
    setSessionActive(false)
    setTestInput('')
  }, [])

  const handleClear = useCallback(() => {
    setLogs([])
    setAst(null)
    setFrames([])
  }, [])

  const handleExampleSelect = useCallback((example: Example) => {
    setSessionActive(false)
    setTestInput('')
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
    setAst(null)
    setLogs([])
    setFrames([])
  }, [])

  const handleGrammarGenerate = useCallback((generated: GeneratedGrammarFiles) => {
    abortRef.current?.abort()
    setSessionActive(false)
    setTestInput('')
    setAst(null)
    setLogs([])
    setFrames([])
    setPendingSteps([])
    setFiles((prev) => {
      let next = upsertFile(prev, 'grammar-input', 'grammar-input.bnf', generated.input, 'plaintext')
      next = upsertFile(next, 'grammar-rkt', 'grammar.rkt', generated.grammarRkt, 'scheme')
      next = upsertFile(next, 'environment-rkt', 'environment.rkt', generated.environmentRkt, 'scheme')
      next = upsertFile(next, 'main', 'main.rkt', generated.mainRkt, 'scheme', generated.mainLockedLines)
      return next
    })
    setActiveFileId('main')
    setGrammarModalOpen(false)
  }, [])

  const handleDownload = useCallback(() => {
    downloadZip(files)
  }, [files])

  const updateFile = useCallback((id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)))
  }, [])

  const initEnvModalElement = initEnvModalOpen ? createInitEnvModalElement(
    files,
    () => setInitEnvModalOpen(false),
    (bindings: InitBinding[]) => {
      const ef = files.find((f) => f.name === 'environment.rkt')
      if (!ef) return
      const newContent = updateInitEnvInContent(ef.content, bindings)
      setFiles((prev) => prev.map((f) =>
        f.id === ef.id ? { ...f, content: newContent, revision: f.revision + 1 } : f
      ))
      setInitEnvModalOpen(false)
    },
  ) : null

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <Navbar
        examples={examples}
        onExampleSelect={handleExampleSelect}
        onGrammarOpen={() => setGrammarModalOpen(true)}
        onDownload={handleDownload}
        onRun={handleStartSession}
        onStop={handleStopSession}
        onClear={handleClear}
        onHelpOpen={() => setHelpOpen(true)}
        running={sessionActive}
        stepMode={stepMode}
        onStepModeToggle={() => { setStepMode((m) => !m); setPendingSteps([]) }}
      />

      <div className="flex-1 overflow-hidden">
        <Group orientation="vertical" style={{ height: '100%' }}>
          <Panel id="top-row" defaultSize={65} minSize={30}>
            <Group orientation="horizontal" style={{ height: '100%' }}>
              <Panel id="code-editor" defaultSize={55} minSize={25}>
                <EditorPanel
                  files={files}
                  activeFileId={activeFileId}
                  onFileSelect={setActiveFileId}
                  onFileChange={updateFile}
                />
              </Panel>
              <ResizeBar className="w-1 cursor-col-resize" />
              <Panel id="right-column" defaultSize={45} minSize={20}>
                <Group orientation="vertical" style={{ height: '100%' }}>
                  <Panel id="ast-viewer" defaultSize={55} minSize={20}>
                    <ASTViewer ast={ast} />
                  </Panel>
                  <ResizeBar className="h-1 cursor-row-resize" />
                  <Panel id="env-panel" defaultSize={45} minSize={20}>
                    <EnvironmentPanel
                  frames={frames}
                  onEditInitEnv={() => setInitEnvModalOpen(true)}
                />
                  </Panel>
                </Group>
              </Panel>
            </Group>
          </Panel>
          <ResizeBar className="h-1 cursor-row-resize" />
          <Panel id="console" defaultSize={35} minSize={15}>
            <ConsoleOutput
              logs={logs}
              inputValue={testInput}
              onInputChange={setTestInput}
              onSubmit={handleRun}
              running={running}
              sessionActive={sessionActive}
              onClear={handleClear}
              pendingSteps={pendingSteps.length}
              onNextStep={handleNextStep}
            />
          </Panel>
        </Group>
      </div>

      {grammarModalOpen && (
        <GrammarModal
          onClose={() => setGrammarModalOpen(false)}
          onGenerate={handleGrammarGenerate}
        />
      )}

      {initEnvModalElement}

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} sections={helpSections} />

      <WelcomeModal />
    </div>
  )
}
