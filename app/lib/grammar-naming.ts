import type { Production, BNFItem } from '@/app/types/bnf'

export function sym(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '')
}

export function autoVariantName(lhsSym: string, index: number, prod: Production): string {
  if (prod.variantName) return prod.variantName

  // EOPL convention: first production of program rule → a-program
  if (lhsSym === 'program' && index === 0) return 'a-program'

  // Try to build a name from the first terminal keyword
  const keyword = prod.items
    .filter((i): i is Extract<BNFItem, { kind: 'terminal' }> => i.kind === 'terminal')
    .map((i) => i.value.replace(/[^a-z0-9]/gi, ''))
    .find(Boolean)

  if (keyword) return `${lhsSym}-${keyword}-exp`

  // Fall back to numbered variant
  return index === 0 ? `${lhsSym}-exp` : `${lhsSym}-${index + 1}-exp`
}
