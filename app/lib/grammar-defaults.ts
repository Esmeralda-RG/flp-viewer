export const STUB_RE = /^(\s*); ⚠ "(.+?)" — falta implementar/

export const SCHEME_COLORS: [RegExp, string][] = [
  [/^(#lang\s+\S+)/, 'text-green-400'],
  [/^(;;;.*|;;.*)/, 'text-zinc-400'],
  [/^(\s*;.*)/, 'text-zinc-400'],
  [/^(\s*\(define\b)/, 'text-blue-400'],
  [/^(\s*\(provide\b)/, 'text-purple-400'],
]

export const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: 'var(--font-geist-mono), Menlo, Monaco, monospace',
  lineNumbers: 'on' as const,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 10 },
}

export const DEFAULT_LEX = `; Tokens disponibles: number  float  identifier  binary  octal  hex  text
; whitespace y comment siempre se incluyen automáticamente
; Deja vacío para incluir todos los tokens del curso
number
identifier
`

export const DEFAULT_GRAMMAR = `<program> ::= <expr>

<expr> ::= <number>                                    => lit-exp
         | <identifier>                                => var-exp
         | "-" "(" <expr> "," <expr> ")"              => diff-exp
         | "zero?" "(" <expr> ")"                     => zero?-exp
         | "if" <expr> "then" <expr> "else" <expr>    => if-exp
         | "let" <identifier> "=" <expr> "in" <expr>  => let-exp
         | "proc" "(" <identifier> ")" <expr>         => proc-exp
         | "(" <expr> <expr> ")"                      => call-exp
`
