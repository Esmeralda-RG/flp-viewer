import type { ArrowProps } from '@/app/types/props'

export default function Arrow({
  x1, y1, x2, y2,
  color = '#4b5563', dashed = false, markerId = 'arrowhead', testId, dataFrom, dataTo,
}: Readonly<ArrowProps>) {
  const cx = (x1 + x2) / 2
  return (
    <path
      data-testid={testId}
      data-from={dataFrom}
      data-to={dataTo}
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray={dashed ? '4 3' : undefined}
      markerEnd={`url(#${markerId})`}
    />
  )
}
