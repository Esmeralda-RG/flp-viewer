#lang racket
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
     (let* ([data     (struct->vector v)]
            [raw-type (symbol->string (vector-ref data 0))]
            [type     (regexp-replace #rx"^struct:" raw-type "")]
            [fields   (for/list ([i (in-range 1 (vector-length data))])
                        (json-value (vector-ref data i)))])
       (hasheq 'type type 'fields fields))]
    [(procedure? v) (hasheq 'type "procedure")]
    [else (format "~a" v)]))

(define (frame->json frame)
  ;; JSON hash keys must be symbols in Racket's json library
  (for/hasheq ([binding frame])
    (values (car binding) (json-value (cdr binding)))))

(define (env-snapshot->json snapshot)
  (match snapshot
    [(list tag frames)
     (hasheq 'tag (symbol->string tag)
             'frames (map frame->json frames))]
    [_ (hasheq 'tag "unknown" 'frames '())]))

; Char-stream compatible con el protocolo interno de sllgen
(define (make-char-stream str)
  (let ([len (string-length str)])
    (vector
     (lambda (vec sk th)
       (let ([i (vector-ref vec 3)])
         (if (>= i len)
             (th)
             (begin (vector-set! vec 3 (+ i 1))
                    (sk (string-ref (vector-ref vec 4) i))))))
     (lambda (ch vec) (vector-set! vec 3 (- (vector-ref vec 3) 1)))
     1 0 str)))

(define (run-trace source)
  (let ([all-steps '()])
    (let loop ([s (stream-parser (make-char-stream source))])
      (with-handlers
        ([exn:fail?
          (lambda (e)
            (unless (regexp-match? #rx"can't begin with end-marker" (exn-message e))
              (raise e)))])
        (s (lambda (ast next-s)
             (reset-env-log!)
             (define val
               (with-handlers
                 ([exn:fail? (lambda (e) (format "✕ ~a" (exn-message e)))])
                 (eval-program ast)))
             (set! all-steps
               (cons (hasheq 'ast          (json-value ast)
                             'output       (json-value val)
                             'environments (map env-snapshot->json (reverse (env-log))))
                     all-steps))
             (loop next-s))
           (lambda () (void)))))
    (reverse all-steps)))

(define args  (current-command-line-arguments))
(define input (if (zero? (vector-length args)) "void" (vector-ref args 0)))
(write-json (run-trace input))
(newline)
