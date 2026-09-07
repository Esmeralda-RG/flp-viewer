import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import type { GlossaryTerm } from '@/app/types/glossary'

const FrontmatterSchema = z.object({
  term:  z.string().min(1),
  title: z.string().min(1),
  relatedHelp: z.string().optional(),
})

export function loadGlossaryTerms(): GlossaryTerm[] {
  const glossaryDir = path.join(process.cwd(), 'app', 'content', 'glossary')

  return fs
    .readdirSync(glossaryDir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(glossaryDir, file), 'utf-8')
      const { data, content } = matter(raw)

      const meta = FrontmatterSchema.parse(data)

      return { ...meta, md: content.trim() }
    })
}
