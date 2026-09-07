import type { HelpSection } from '@/app/types/help'

export function filterSections(sections: HelpSection[], query: string): HelpSection[] {
  const q = query.trim().toLowerCase()
  if (!q) return sections
  return sections.filter(s =>
    s.title.toLowerCase().includes(q) || s.md.toLowerCase().includes(q)
  )
}
