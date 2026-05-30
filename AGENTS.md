<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

## Types and interfaces

All TypeScript `interface` and `type` declarations must live in `app/types/`. Never define them inline inside component or lib files. Import from `app/types/` and re-export if the consuming file needs to expose them.

```
app/types/
  ast.ts          → ASTNode
  bnf.ts          → TokenKind, Token, BNFItem, Production, GrammarRule, GrammarAST
  console.ts      → LogLevel, LogEntry
  editor.ts       → EditorFile, GeneratedGrammarFiles
  environment.ts  → Binding, EnvFrame
  examples.ts     → Example, ExampleFile
  grammar.ts      → InitBinding, PipelineResult, MainGeneratorResult
  help.ts         → HelpSection
  racket.ts       → EditorFileLike, StepResult, TraceResult
```

## Comments in components

Do not use JSX comments as structural labels (`{/* Header */}`, `{/* Backdrop */}`, `{/* Body */}`). These describe obvious structure and add noise. Only write a comment when it explains a non-obvious decision, constraint, or workaround — not what the code does.
