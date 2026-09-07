'use client'

import { useState } from 'react'
import { Panel, Group } from 'react-resizable-panels'
import Navbar from './Navbar'
import ResizeBar from './ResizeBar'
import EditorPanel from '../editor/EditorPanel'
import ASTViewer from '../ast/ASTViewer'
import ConsoleOutput from '../console/ConsoleOutput'
import EnvironmentPanel from '../environment/EnvironmentPanel'
import GrammarModal from '../modals/GrammarModal'
import WelcomeModal from '../modals/WelcomeModal'
import InitEnvModal from '../modals/InitEnvModal'
import HelpDrawer from '../help/HelpDrawer'
import { useProjectFiles } from '@/app/hooks/useProjectFiles'
import { useRacketSession } from '@/app/hooks/useRacketSession'
import type { PlaygroundLayoutProps } from '@/app/types/props'
import type { Example } from '@/app/types/examples'
import type { GeneratedGrammarFiles } from '@/app/types/editor'

export default function PlaygroundLayout({ examples, helpSections, glossaryTerms }: Readonly<PlaygroundLayoutProps>) {
  const projectFiles = useProjectFiles(examples)
  const session = useRacketSession()

  const [grammarModalOpen, setGrammarModalOpen] = useState(false)
  const [initEnvModalOpen, setInitEnvModalOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const handleRun = () => {
    session.run(projectFiles.files.map((f) => ({ name: f.name, content: f.content })))
  }

  const handleExampleSelect = (example: Example) => {
    session.resetForFileChange()
    projectFiles.loadExample(example)
  }

  const handleGrammarGenerate = (generated: GeneratedGrammarFiles) => {
    session.resetForFileChange()
    projectFiles.applyGeneratedGrammar(generated)
    setGrammarModalOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
      <Navbar
        examples={examples}
        onExampleSelect={handleExampleSelect}
        onGrammarOpen={() => setGrammarModalOpen(true)}
        onDownload={projectFiles.download}
        onRun={session.start}
        onStop={session.stop}
        onClear={session.clear}
        onHelpOpen={() => setHelpOpen(true)}
        running={session.sessionActive}
        stepMode={session.stepMode}
        onStepModeToggle={session.toggleStepMode}
      />

      <div className="flex-1 overflow-hidden">
        <Group orientation="vertical" style={{ height: '100%' }}>
          <Panel id="top-row" defaultSize={65} minSize={30}>
            <Group orientation="horizontal" style={{ height: '100%' }}>
              <Panel id="code-editor" defaultSize={55} minSize={25}>
                <EditorPanel
                  files={projectFiles.files}
                  activeFileId={projectFiles.activeFileId}
                  onFileSelect={projectFiles.setActiveFileId}
                  onFileChange={projectFiles.updateFile}
                  glossaryTerms={glossaryTerms}
                />
              </Panel>
              <ResizeBar className="w-1 cursor-col-resize" />
              <Panel id="right-column" defaultSize={45} minSize={20}>
                <Group orientation="vertical" style={{ height: '100%' }}>
                  <Panel id="ast-viewer" defaultSize={55} minSize={20}>
                    <ASTViewer ast={session.ast} />
                  </Panel>
                  <ResizeBar className="h-1 cursor-row-resize" />
                  <Panel id="env-panel" defaultSize={45} minSize={20}>
                    <EnvironmentPanel
                      frames={session.frames}
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
              logs={session.logs}
              inputValue={session.testInput}
              onInputChange={session.setTestInput}
              onSubmit={handleRun}
              running={session.running}
              sessionActive={session.sessionActive}
              onClear={session.clear}
              pendingSteps={session.pendingSteps}
              onNextStep={session.nextStep}
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

      {initEnvModalOpen && (
        <InitEnvModal
          bindings={projectFiles.getInitEnvBindings()}
          onClose={() => setInitEnvModalOpen(false)}
          onApply={(bindings) => {
            projectFiles.applyInitEnv(bindings)
            setInitEnvModalOpen(false)
          }}
        />
      )}

      <HelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        sections={helpSections}
        examples={examples}
        currentExampleId={projectFiles.currentExampleId}
        onLoadExample={handleExampleSelect}
      />

      <WelcomeModal />
    </div>
  )
}
