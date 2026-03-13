import { Group, Panel, Separator } from 'react-resizable-panels'
import type { ReactNode } from 'react'

type PanelLayoutProps = {
  leftPanel: ReactNode
  rightTopPanel: ReactNode
  rightBottomPanel: ReactNode
}

function ResizeHandle({ vertical = false }: Readonly<{ vertical?: boolean }>) {
  return (
    <Separator
      className={vertical ? 'h-2 rounded-md bg-slate-800' : 'w-2 rounded-md bg-slate-800'}
    />
  )
}

function PanelLayout({ leftPanel, rightTopPanel, rightBottomPanel }: Readonly<PanelLayoutProps>) {
  return (
    <main className="min-h-0 flex-1 p-3">
      <Group orientation="horizontal" className="h-full gap-2">
        <Panel defaultSize={56} minSize={35}>{leftPanel}</Panel>
        <ResizeHandle />
        <Panel defaultSize={44} minSize={25}>
          <Group orientation="vertical" className="h-full gap-2">
            <Panel defaultSize={58} minSize={30}>
              <div className="h-full p-3">{rightTopPanel}</div>
            </Panel>
            <ResizeHandle vertical />
            <Panel defaultSize={42} minSize={25}>
              <div className="h-full p-3">{rightBottomPanel}</div>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </main>
  )
}

export default PanelLayout