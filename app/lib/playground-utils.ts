import JSZip from 'jszip'
import type { EditorFile } from '@/app/types/editor'
import { generateUtilsRkt } from './utils-generator'

export const INITIAL_CODE = `; intérprete simple — escribe tu código aquí
`

export const INITIAL_FILES: EditorFile[] = [
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

export function upsertFile(
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

function prepareForDownload(file: EditorFile): EditorFile {
  if (file.name !== 'main.rkt') return file
  const content = file.content.replace(/^; \(interpreter\)(.*)$/m, '(interpreter)$1')
  return { ...file, content }
}

export async function downloadZip(files: EditorFile[], zipName = 'flp-project.zip') {
  const zip = new JSZip()
  for (const f of files) {
    const prepared = prepareForDownload(f)
    const _yesterday = new Date()
    _yesterday.setDate(_yesterday.getDate() - 1)
    zip.file(prepared.name, prepared.content, { date: _yesterday })
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  URL.revokeObjectURL(url)
}
