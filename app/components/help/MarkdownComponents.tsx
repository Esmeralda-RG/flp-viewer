import type { MarkdownChildrenProps, MarkdownCodeProps } from '@/app/types/props'

export const mdComponents = {
  h1: ({ children }: MarkdownChildrenProps) => (
    <h1 className="text-lg font-bold text-zinc-100 mb-3 mt-1 pb-2 border-b border-zinc-700/60">{children}</h1>
  ),
  h2: ({ children }: MarkdownChildrenProps) => (
    <h2 className="text-sm font-semibold text-zinc-200 mb-2 mt-5">{children}</h2>
  ),
  h3: ({ children }: MarkdownChildrenProps) => (
    <h3 className="text-xs font-semibold text-zinc-300 mb-1.5 mt-4 uppercase tracking-wide">{children}</h3>
  ),
  p: ({ children }: MarkdownChildrenProps) => (
    <p className="text-xs text-zinc-300 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: MarkdownChildrenProps) => (
    <ul className="list-none mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: MarkdownChildrenProps) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 text-xs text-zinc-300">{children}</ol>
  ),
  li: ({ children }: MarkdownChildrenProps) => (
    <li className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
      <span className="text-zinc-400 shrink-0 mt-0.5">›</span>
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className }: MarkdownCodeProps) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <code className="block font-mono text-[11px] text-emerald-300 leading-relaxed whitespace-pre">
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-[11px] bg-zinc-800 text-amber-300 px-1 py-px rounded border border-zinc-700/60">
        {children}
      </code>
    )
  },
  pre: ({ children }: MarkdownChildrenProps) => (
    <pre className="bg-[#1a1a1a] border border-zinc-700/50 rounded-lg p-3 mb-3 overflow-x-auto">
      {children}
    </pre>
  ),
  blockquote: ({ children }: MarkdownChildrenProps) => (
    <blockquote className="border-l-2 border-blue-500/60 pl-3 mb-3 text-xs text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  strong: ({ children }: MarkdownChildrenProps) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }: MarkdownChildrenProps) => (
    <em className="text-zinc-300 not-italic font-medium">{children}</em>
  ),
  table: ({ children }: MarkdownChildrenProps) => (
    <div className="overflow-x-auto mb-4 rounded-lg border border-zinc-700/60">
      <table className="w-full text-[11px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: MarkdownChildrenProps) => (
    <thead className="bg-zinc-800/80">{children}</thead>
  ),
  tr: ({ children }: MarkdownChildrenProps) => (
    <tr className="border-b border-zinc-700/50 even:bg-zinc-800/30 last:border-0">{children}</tr>
  ),
  th: ({ children }: MarkdownChildrenProps) => (
    <th className="px-3 py-2 text-left font-semibold text-zinc-300 text-[11px] border-b border-zinc-600/60">{children}</th>
  ),
  td: ({ children }: MarkdownChildrenProps) => (
    <td className="px-3 py-2 text-zinc-300 font-mono text-[11px]">{children}</td>
  ),
  hr: () => <hr className="border-zinc-700/50 my-4" />,
}
