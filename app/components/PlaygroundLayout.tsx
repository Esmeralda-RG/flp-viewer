'use client'

import { useState, useCallback, useRef } from 'react'
import { Panel, Group, Separator } from 'react-resizable-panels'
import JSZip from 'jszip'
import Navbar, { type Example } from './Navbar'
import EditorPanel, { type EditorFile } from './EditorPanel'
import ASTViewer, { type ASTNode } from './ASTViewer'
import ConsoleOutput, { type LogEntry } from './ConsoleOutput'
import EnvironmentPanel, { type EnvFrame } from './EnvironmentPanel'
import GrammarModal, { type GeneratedGrammarFiles } from './GrammarModal'
import { runTrace } from '@/app/services/racket'
import { generateUtilsRkt } from '@/app/lib/utils-generator'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// Strip FLP-VIEWER-TRACKING block and uncomment interpreter for download
function prepareForDownload(file: EditorFile): EditorFile {
  if (file.name === 'environment.rkt') {
    const content = file.content
      .replace(/\n?;; ──── FLP-VIEWER-TRACKING-START ────[\s\S]*?;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────\n?/g, '\n')
      .trimEnd() + '\n'
    return { ...file, content }
  }
  if (file.name === 'main.rkt') {
    const content = file.content.replace(
      /^; \(interpreter\)(.*)$/m,
      '(interpreter)$1',
    )
    return { ...file, content }
  }
  return file
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlaygroundLayout() {
  const [files, setFiles] = useState<EditorFile[]>(INITIAL_FILES)
  const [activeFileId, setActiveFileId] = useState('main')
  const [grammarModalOpen, setGrammarModalOpen] = useState(false)
  const [testInput, setTestInput] = useState('')

  const [ast, setAst] = useState<ASTNode | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [frames, setFrames] = useState<EnvFrame[]>([])
  const [running, setRunning] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'output') => {
    setLogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), level, message, timestamp: Date.now() },
    ])
  }, [])

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

    // Echo the input into the log and clear the textarea immediately
    addLog(expr, 'input')
    setTestInput('')

    try {
      const result = await runTrace(
        files.map((f) => ({ name: f.name, content: f.content })),
        expr,
        controller.signal,
      )

      if (result.ast) setAst(result.ast)
      if (result.environments.length > 0) setFrames(result.environments)

      if (result.stderr) {
        result.stderr.split('\n').filter(Boolean).forEach((line) => addLog(line, 'error'))
      } else if (result.output !== null && result.output !== '"void"' && result.output !== 'null') {
        addLog(result.output, 'output')
      } else if (!result.stderr) {
        addLog('void', 'info')
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        addLog('Ejecución detenida.', 'info')
      } else {
        addLog('Error al conectar con el servidor de ejecución.', 'error')
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [files, testInput, running, addLog])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleClear = useCallback(() => {
    setLogs([])
    setAst(null)
    setFrames([])
  }, [])

  const handleExampleSelect = useCallback((example: Example) => {
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

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <Navbar
        onExampleSelect={handleExampleSelect}
        onGrammarOpen={() => setGrammarModalOpen(true)}
        onDownload={handleDownload}
        onRun={handleRun}
        onStop={handleStop}
        onClear={handleClear}
        running={running}
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
                    <EnvironmentPanel frames={frames} />
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
              onClear={handleClear}
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
    </div>
  )
}
