import { useState } from 'react'
import ASTViewer from '@/components/ASTViewer'
import CodeEditor from '@/components/CodeEditor'
import ConsoleOutput from '@/components/ConsoleOutput'
import EnvironmentPanel from '@/components/EnvironmentPanel'
import Navbar from '@/components/Navbar'
import PanelLayout from '@/components/PanelLayout'
import {
  initialEditorCode,
  simulatedAst,
  simulatedConsoleBoot,
  simulatedEvaluationSteps,
} from '@/data/mockData'

function App() {
  const [code, setCode] = useState(initialEditorCode)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showAst, setShowAst] = useState(true)
  const [logs, setLogs] = useState(simulatedConsoleBoot)

  const appendLog = (message: string) => {
    setLogs((previous) => [...previous, message])
  }

  const handleRunToggle = () => {
    setIsRunning((previous) => {
      const next = !previous
      appendLog(next ? 'Running evaluator...' : 'Execution paused.')
      return next
    })
  }

  const handleParse = () => {
    appendLog('Parsing program...')
    appendLog('AST generated')
  }

  const handleShowAst = () => {
    setShowAst(true)
    appendLog('AST viewer focused.')
  }

  const handleNextEvaluation = () => {
    setCurrentStep((previous) => {
      const next = Math.min(previous + 1, simulatedEvaluationSteps.length - 1)
      const step = simulatedEvaluationSteps[next]
      appendLog(step.log)
      return next
    })
  }

  const handleReset = () => {
    setCode(initialEditorCode)
    setIsRunning(false)
    setCurrentStep(0)
    setShowAst(true)
    setLogs(simulatedConsoleBoot)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <PanelLayout
        leftPanel={
          <div className="flex h-full flex-col gap-3 p-3">
            <CodeEditor
              code={code}
              isRunning={isRunning}
              onCodeChange={setCode}
              onRunToggle={handleRunToggle}
              onParse={handleParse}
              onShowAst={handleShowAst}
              onNextEvaluation={handleNextEvaluation}
              onReset={handleReset}
            />
            <ConsoleOutput logs={logs} />
          </div>
        }
        rightTopPanel={<ASTViewer ast={simulatedAst} visible={showAst} />}
        rightBottomPanel={
          <EnvironmentPanel steps={simulatedEvaluationSteps} currentStep={currentStep} />
        }
      />
    </div>
  )
}

export default App
