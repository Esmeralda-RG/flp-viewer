import { Separator } from 'react-resizable-panels'
import type { ResizeBarProps } from '@/app/types/props'

export default function ResizeBar({ className }: Readonly<ResizeBarProps>) {
  return (
    <Separator
      className={[
        'bg-[#3c3c3c] hover:bg-blue-500 transition-colors shrink-0',
        className,
      ].join(' ')}
    />
  )
}
