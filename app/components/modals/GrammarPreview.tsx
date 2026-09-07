import type { GrammarPreviewProps } from '@/app/types/props'
import { STUB_RE } from '@/app/lib/grammar-defaults'
import StubLine from './StubLine'
import SchemeLine from './SchemeLine'

export default function GrammarPreview({ content, onStubFill }: Readonly<GrammarPreviewProps>) {
  const lines = content.split('\n')

  return (
    <div className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed" tabIndex={0}>
      {lines.map((line, i) => {
        const m = new RegExp(STUB_RE).exec(line)
        if (m) {
          const tokenName = m[2]
          return (
            <StubLine
              key={`${tokenName}-${line.trim()}`}
              tokenName={tokenName}
              onFill={(rule) => onStubFill(tokenName, rule)}
            />
          )
        }
        return (
          <div key={`line-${i}-${line}`} className="whitespace-pre">
            <SchemeLine text={line} />
          </div>
        )
      })}
    </div>
  )
}
