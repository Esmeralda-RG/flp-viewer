import type { SchemeLineProps } from '@/app/types/props'
import { SCHEME_COLORS } from '@/app/lib/grammar-defaults'

export default function SchemeLine({ text }: Readonly<SchemeLineProps>) {
  for (const [re, cls] of SCHEME_COLORS) {
    if (re.test(text)) return <span className={cls}>{text}</span>
  }
  return <span className="text-zinc-300">{text}</span>
}
