import type { StepProps } from '@/app/types/props'

export default function Step({ num, children }: Readonly<StepProps>) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-semibold flex items-center justify-center mt-0.5">
        {num}
      </span>
      <span className="text-sm text-zinc-300 leading-relaxed">{children}</span>
    </div>
  )
}
