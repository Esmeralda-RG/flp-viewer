import PlaygroundLayout from './components/layout/PlaygroundLayout'
import { loadExamples } from './lib/load-examples'
import { loadHelpSections } from './content/load-help'

export default async function Page() {
  const [examples, helpSections] = await Promise.all([
    loadExamples(),
    Promise.resolve(loadHelpSections()),
  ])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PlaygroundLayout examples={examples} helpSections={helpSections} />
    </div>
  )
}
