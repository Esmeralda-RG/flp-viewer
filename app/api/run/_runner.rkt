#lang racket
(require json)
(require "_json-value.rkt")
(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")
(require "main.rkt")

(define (frame->json frame)
  ;; Un hasheq no conserva el orden de declaración al serializar (las claves
  ;; salen en orden de hash, no de inserción); el panel necesita ese orden
  ;; para mostrar las ligaduras tal como las escribió el estudiante.
  ;; binding ya viene convertido a JSON (ver _tracking.rkt): se registra al
  ;; momento de crear el marco, no al final del paso, para no mostrar el
  ;; estado que una asignación posterior dejó en una celda compartida.
  (for/list ([binding frame])
    (hasheq 'name (symbol->string (car binding)) 'value (cdr binding))))

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
            ; "can't begin with end-marker" también es el mensaje que lanza sllgen
            ; cuando el stream termina de forma abrupta por un error de sintaxis real
            ; (p. ej. un paréntesis sin cerrar). Solo es un fin de stream benigno si
            ; ya se parseó al menos un programa completo antes; si no, es un error
            ; genuino y hay que mostrarlo en vez de tragárselo en silencio.
            (unless (and (pair? all-steps)
                         (regexp-match? #rx"can't begin with end-marker" (exn-message e)))
              (set! all-steps
                (cons (hasheq 'ast #f
                              'output (format "✕ ~a" (exn-message e))
                              'environments '())
                      all-steps))))])
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
