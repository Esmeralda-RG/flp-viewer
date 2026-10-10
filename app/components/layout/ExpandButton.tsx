import type { ExpandButtonProps } from '@/app/types/props'

export default function ExpandButton({ expanded, onToggle }: Readonly<ExpandButtonProps>) {
  const label = expanded ? 'Salir de pantalla completa' : 'Pantalla completa'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={expanded ? `${label} (Esc)` : label}
      className="ml-1 p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {expanded ? (
          <path d="M4.5 1v3.5H1M7.5 1v3.5H11M4.5 11V7.5H1M7.5 11V7.5H11" />
        ) : (
          <path d="M1 4.5V1h3.5M11 4.5V1H7.5M1 7.5V11h3.5M11 7.5V11H7.5" />
        )}
      </svg>
    </button>
  )
}
