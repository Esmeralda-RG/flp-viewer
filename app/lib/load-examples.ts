import fs from 'node:fs'
import path from 'node:path'
import type { Example, ExampleFile, Meta} from '@/app/types/examples'

export async function loadExamples(): Promise<Example[]> {
  const examplesDir = path.join(process.cwd(), 'examples')

  let entries: string[]
  try {
    entries = fs.readdirSync(examplesDir)
  } catch {
    return []
  }

  const examples: (Example & { order: number })[] = []

  for (const entry of entries) {
    const exampleDir = path.join(examplesDir, entry)
    if (!fs.statSync(exampleDir).isDirectory()) continue

    const metaPath = path.join(exampleDir, 'meta.json')
    if (!fs.existsSync(metaPath)) continue

    const meta: Meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

    const files: ExampleFile[] = meta.files.map((f) => {
      const content = fs.readFileSync(path.join(exampleDir, f.name), 'utf-8')
      return { id: f.id, name: f.name, language: f.language, lockedLines: f.lockedLines, content }
    })

    const activeFile = files.find((f) => f.id === meta.activeFileId) ?? files[0]

    examples.push({
      id: meta.id,
      label: meta.label,
      description: meta.description,
      code: activeFile.content,
      activeFileId: meta.activeFileId,
      order: meta.order ?? Number.MAX_SAFE_INTEGER,
      files,
    })
  }

  return examples
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ order: _order, ...example }) => example)
}
