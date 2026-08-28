import type { EnvHeaderProps } from '@/app/types/props'

export default function EnvHeader({ count, onReset, onEditInitEnv }: Readonly<EnvHeaderProps>) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Ambiente</span>
      {onEditInitEnv && (
        <button
          type="button"
          onClick={onEditInitEnv}
          className="text-[10px] px-1.5 py-0.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Editar ambiente inicial"
        >
          editar init-env
        </button>
      )}
      <div className="flex-1" />
      {count > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">{count} snapshot{count === 1 ? '' : 's'}</span>
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] px-1.5 py-0.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            reset vista
          </button>
        </div>
      )}
    </div>
  )
}
