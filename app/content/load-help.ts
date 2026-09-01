import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import type { HelpSection } from '@/app/types/help'

const FrontmatterSchema = z.object({
  id:    z.string().min(1),
  icon:  z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().default(Number.MAX_SAFE_INTEGER),
  relatedExample: z.string().min(1).optional(),
})

export function loadHelpSections(): HelpSection[] {
  const helpDir = path.join(process.cwd(), 'app', 'content', 'help')

  return fs
    .readdirSync(helpDir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(helpDir, file), 'utf-8')
      const { data, content } = matter(raw)

      const meta = FrontmatterSchema.parse(data)

      return { ...meta, md: content.trim() }
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}
