import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

const RACKET_BIN =
  process.env.RACKET_BIN ??
  '/Applications/Racket v9.1/bin/racket'

// Runner injected at execution time — uses trace-json strategy from environment.rkt tracking
const RUNNER_RKT = `#lang racket
(require json)
(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")
(require "main.rkt")

(define (json-value v)
  (cond
    [(or (null? v) (boolean? v) (number? v) (string? v)) v]
    [(symbol? v) (symbol->string v)]
    [(pair? v) (map json-value v)]
    [(vector? v) (map json-value (vector->list v))]
    [(struct? v)
     (let* ([data   (struct->vector v)]
            [type   (symbol->string (vector-ref data 0))]
            [fields (for/list ([i (in-range 1 (vector-length data))])
                      (json-value (vector-ref data i)))])
       (hasheq 'type type 'fields fields))]
    [(procedure? v) (hasheq 'type "procedure")]
    [else (format "~a" v)]))

(define (frame->json frame)
  (for/hasheq ([binding frame])
    (values (symbol->string (car binding)) (json-value (cdr binding)))))

(define (env-snapshot->json snapshot)
  (match snapshot
    [(list tag frames)
     (hasheq 'tag (symbol->string tag)
             'frames (map frame->json frames))]
    [_ (hasheq 'tag "unknown" 'frames '())]))

(define (run-trace source)
  (reset-env-log!)
  (define ast (scan&parse source))
  (define output (eval-program ast))
  (hasheq 'ast    (json-value ast)
          'output (json-value output)
          'environments (map env-snapshot->json (reverse (env-log)))))

(define args (current-command-line-arguments))
(define input (if (zero? (vector-length args)) "void" (vector-ref args 0)))
(write-json (run-trace input))
(newline)
`

interface FileEntry {
  name: string
  content: string
}

export async function POST(request: Request) {
  let tmpDir: string | null = null

  try {
    const body = (await request.json()) as {
      files?: FileEntry[]
      testInput?: string
    }

    const files = body.files ?? []
    const testInput = (body.testInput ?? 'void').trim() || 'void'

    if (files.length === 0) {
      return Response.json({ stdout: '', stderr: 'No hay archivos para ejecutar.', error: 'No files' })
    }

    tmpDir = await mkdtemp(join(tmpdir(), 'flp-'))

    await Promise.all(files.map((f) => writeFile(join(tmpDir!, f.name), f.content, 'utf8')))
    await writeFile(join(tmpDir, '_runner.rkt'), RUNNER_RKT, 'utf8')

    const { stdout, stderr } = await execFileAsync(
      RACKET_BIN,
      [join(tmpDir, '_runner.rkt'), testInput],
      {
        timeout: 15_000,
        env: { ...process.env, PLTDISABLE_BROWSER_REDIRECT: '1' },
      },
    )

    let trace: Record<string, unknown> | null = null
    try {
      trace = JSON.parse(stdout.trim()) as Record<string, unknown>
    } catch {
      // not JSON — plain racket output
    }

    return Response.json({
      stdout: trace ? '' : stdout.trim(),
      stderr: stderr.trim(),
      error: null,
      trace,
    })
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException & {
      killed?: boolean
      stderr?: string
      stdout?: string
    }
    const stderr = (e.stderr ?? '').trim()
    const error = e.killed
      ? 'Tiempo de ejecución agotado (> 15 s)'
      : (e.message ?? 'Error desconocido')

    return Response.json({
      stdout: (e.stdout ?? '').trim(),
      stderr: stderr || error,
      error,
      trace: null,
    })
  } finally {
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
