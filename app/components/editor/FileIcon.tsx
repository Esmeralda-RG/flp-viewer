import type { FileIconProps } from '@/app/types/props'
import { FILE_EXT_COLORS } from '@/app/lib/playground-utils'

export default function FileIcon({ name }: Readonly<FileIconProps>) {
  const ext = name.split('.').pop() ?? ''
  return (
    <span className={`text-[10px] font-mono ${FILE_EXT_COLORS[ext] ?? 'text-zinc-400'}`}>
      {ext}
    </span>
  )
}
