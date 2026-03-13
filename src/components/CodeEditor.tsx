import Editor from '@monaco-editor/react'

type CodeEditorProps = {
  code: string
  isRunning: boolean
  onCodeChange: (value: string) => void
  onRunToggle: () => void
  onParse: () => void
  onShowAst: () => void
  onNextEvaluation: () => void
  onReset: () => void
}

function CodeEditor({
  code,
  isRunning,
  onCodeChange,
  onRunToggle,
  onParse,
  onShowAst,
  onNextEvaluation,
  onReset,
}: Readonly<CodeEditorProps>) {
  const buttonClass =
    'rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white'

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="h-full min-h-65 overflow-hidden rounded-lg border border-slate-700">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => onCodeChange(value ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRunToggle} className={buttonClass}>
          {isRunning ? 'Detener' : 'Run'}
        </button>
        <button type="button" onClick={onParse} className={buttonClass}>
          Parse
        </button>
        <button type="button" onClick={onShowAst} className={buttonClass}>
          Mostrar AST
        </button>
        <button type="button" onClick={onNextEvaluation} className={buttonClass}>
          Siguiente Evaluacion
        </button>
        <button type="button" onClick={onReset} className={buttonClass}>
          Reset
        </button>
      </div>
    </section>
  )
}

export default CodeEditor