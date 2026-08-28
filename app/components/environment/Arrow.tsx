import type { ArrowProps } from '@/app/types/props'

export default function Arrow({ x1, y1, x2, y2 }: Readonly<ArrowProps>) {
  const cx = (x1 + x2) / 2
  return (
    <path
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      fill="none" stroke="#4b5563" strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  )
}
