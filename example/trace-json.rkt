#lang racket

(require json
         "environment.rkt"
         "main.rkt")

(provide program->trace-json
         program->trace-json-string
         run-trace-json)

(define (json-value v)
  (cond
    [(or (null? v) (boolean? v) (number? v) (string? v)) v]
    [(symbol? v) (symbol->string v)]
    [(pair? v) (map json-value v)]
    [(vector? v) (map json-value (vector->list v))]
    [(struct? v)
     (let* ([data (struct->vector v)]
            [type (symbol->string (vector-ref data 0))]
            [fields (for/list ([i (in-range 1 (vector-length data))])
                      (json-value (vector-ref data i)))])
           (hasheq 'type type
             'fields fields))]
    [else (format "~a" v)]))

(define (frame->json frame)
  (for/hasheq ([binding frame])
    (values (car binding) (json-value (cdr binding)))))

(define (env-snapshot->json snapshot)
  (match snapshot
    [(list tag frames)
     (hasheq 'tag (symbol->string tag)
             'frames (map frame->json frames))]
    [_ (hasheq 'tag "unknown" 'frames '())]))

(define (ast->json ast)
  (json-value ast))

(define (program->trace-json source)
  (reset-env-log!)
  (define ast (scan&parse source))
  (define output (eval-program ast))
  (hasheq 'input source
          'ast (ast->json ast)
          'output (json-value output)
          'environments (map env-snapshot->json (reverse (env-log)))))

(define (program->trace-json-string source)
  (jsexpr->string (program->trace-json source)))

(define (run-trace-json source)
  (displayln (program->trace-json-string source)))

(module+ main
  (define args (current-command-line-arguments))
  (define input
    (if (zero? (vector-length args))
        "var x = 1 in begin set x = 2 end"
        (vector-ref args 0)))
  (run-trace-json input))