import {
  Background,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import { useMemo } from 'react'
import '@xyflow/react/dist/style.css'
import type { EvaluationStep } from '@/types'

type EnvironmentPanelProps = {
  steps: EvaluationStep[]
  currentStep: number
}

function EnvironmentPanel({ steps, currentStep }: Readonly<EnvironmentPanelProps>) {
  const nodes = useMemo<Node[]>(() => {
    return steps.map((step, index) => {
      const isCurrent = index === currentStep

      return {
        id: `env-${index}`,
        position: {
          x: index * 290,
          y: index % 2 === 0 ? 20 : 170,
        },
        data: {
          label: (
            <div className="w-58 space-y-2 text-left text-xs">
              <div className="font-semibold text-cyan-300">{step.environment.scopeName}</div>
              <div className="text-slate-400">Paso: {index + 1}</div>
              {step.environment.parentScopeName ? (
                <div className="text-slate-500">Padre: {step.environment.parentScopeName}</div>
              ) : null}
              <div className="rounded border border-slate-700 bg-slate-950 p-2">
                {step.environment.entries.map((entry) => (
                  <div key={`${step.environment.scopeName}-${entry.name}`} className="flex justify-between gap-2">
                    <span className="text-cyan-200">{entry.name}</span>
                    <span className="text-slate-300">→ {entry.value}</span>
                  </div>
                ))}
              </div>
              <div className="text-slate-400">{step.log}</div>
            </div>
          ),
        },
        style: {
          background: '#0f172a',
          border: isCurrent ? '1px solid #22d3ee' : '1px solid #334155',
          borderRadius: '10px',
          color: '#e2e8f0',
          padding: '8px',
          width: 260,
        },
        draggable: true,
      }
    })
  }, [currentStep, steps])

  const edges = useMemo<Edge[]>(() => {
    return steps
      .slice(1)
      .map((_, index) => {
        const targetIndex = index + 1

        return {
          id: `e-${index}-${targetIndex}`,
          source: `env-${index}`,
          target: `env-${targetIndex}`,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          animated: targetIndex === currentStep,
        }
      })
  }, [currentStep, steps])

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
        Environment Viewer
      </h2>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="#1f2937" />
        </ReactFlow>
      </div>
    </section>
  )
}

export default EnvironmentPanel