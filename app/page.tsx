import PlaygroundLayout from './components/layout/PlaygroundLayout'
import { loadExamples } from './lib/load-examples'
import { loadHelpSections } from './content/load-help'
import { loadGlossaryTerms } from './content/load-glossary'

export default function Page() {
  const examples = loadExamples()
  const helpSections = loadHelpSections()
  const glossaryTerms = loadGlossaryTerms()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PlaygroundLayout examples={examples} helpSections={helpSections} glossaryTerms={glossaryTerms} />
    </div>
  )
}
