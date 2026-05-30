'use client'

import CodeEditor from './CodeEditor'
import type { EditorFile } from '@/app/types/editor'
export type { EditorFile }

interface EditorPanelProps {
  files: EditorFile[]
  activeFileId: string
  onFileSelect: (id: string) => void
  onFileChange: (id: string, content: string) => void
}

export default function EditorPanel({
  files,
  activeFileId,
  onFileSelect,
  onFileChange,
}: Readonly<EditorPanelProps>) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
       
      <div className="flex items-end bg-[#252526] border-b border-[#3c3c3c] shrink-0 overflow-x-auto">
        {files.map((file) => {
          const active = file.id === activeFileId
          return (
            <button
              key={file.id}
              onClick={() => onFileSelect(file.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 text-xs border-b-2 shrink-0 transition-colors whitespace-nowrap',
                active
                  ? 'text-white border-blue-500 bg-[#1e1e1e]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5',
              ].join(' ')}
            >
              <FileIcon name={file.name} />
              {file.name}
            </button>
          )
        })}
         
        <div className="ml-auto px-3 py-2 text-[10px] text-zinc-600 shrink-0">
          {files.find((f) => f.id === activeFileId)?.language}
        </div>
      </div>

       
      <div className="flex-1 min-h-0 relative">
        {files.map((file) => (
          <div
            key={file.id}
            className={[
              'absolute inset-0',
              file.id === activeFileId ? 'block' : 'hidden',
            ].join(' ')}
          >
            <CodeEditor
              key={`${file.id}-${file.revision}`}
              value={file.content}
              onChange={(content) => onFileChange(file.id, content)}
              language={file.language}
              lockedLines={file.lockedLines}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function FileIcon({ name }: Readonly<{ name: string }>) {
  const ext = name.split('.').pop() ?? ''
  const colors: Record<string, string> = {
    rkt: 'text-red-400',
    g: 'text-yellow-400',
    lark: 'text-yellow-400',
    ebnf: 'text-yellow-400',
    txt: 'text-zinc-400',
  }
  return (
    <span className={`text-[10px] font-mono opacity-70 ${colors[ext] ?? 'text-zinc-400'}`}>
      {ext}
    </span>
  )
}
