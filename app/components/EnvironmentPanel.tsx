'use client'

export interface Binding {
  name: string
  value: string
  type: string
}

export interface EnvFrame {
  label: string
  bindings: Binding[]
}

const typeColors: Record<string, string> = {
  number: 'text-blue-300',
  string: 'text-green-300',
  boolean: 'text-amber-300',
  lambda: 'text-purple-300',
  list: 'text-cyan-300',
  void: 'text-zinc-500',
}

function typeColor(type: string) {
  return typeColors[type] ?? 'text-zinc-300'
}

interface EnvironmentPanelProps {
  frames: EnvFrame[]
}

export default function EnvironmentPanel({ frames }: Readonly<EnvironmentPanelProps>) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Ambiente</span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {frames.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-600">Sin bindings activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {frames.map((frame, i) => (
              <div key={`frame-${i}-${frame.label}`} >
                <div className="text-xs font-semibold text-zinc-500 px-1 mb-1">{frame.label}</div>
                <div className="space-y-0.5">
                  {frame.bindings.map((b, j) => (
                    <div
                      key={`binding-${i}-${j}`}
                      className="flex items-baseline gap-2 px-2 py-0.5 rounded hover:bg-white/5 font-mono text-xs"
                    >
                      <span className="text-zinc-200 min-w-0 truncate">{b.name}</span>
                      <span className="text-zinc-600 shrink-0">=</span>
                      <span className={`truncate ${typeColor(b.type)}`}>{b.value}</span>
                      <span className="text-zinc-700 text-[10px] ml-auto shrink-0">{b.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
