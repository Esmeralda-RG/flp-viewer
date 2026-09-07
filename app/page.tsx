import PlaygroundLayout from './components/layout/PlaygroundLayout'
import { loadExamples } from './lib/load-examples'
import { loadHelpSections } from './content/load-help'
import { loadGlossaryTerms } from './content/load-glossary'

export default async function Page() {
  const [examples, helpSections, glossaryTerms] = await Promise.all([
    loadExamples(),
    Promise.resolve(loadHelpSections()),
    Promise.resolve(loadGlossaryTerms()),
  ])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PlaygroundLayout examples={examples} helpSections={helpSections} glossaryTerms={glossaryTerms} />
    </div>
  )
}
