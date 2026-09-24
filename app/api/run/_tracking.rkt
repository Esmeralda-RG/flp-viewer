
;; ──── FLP-VIEWER-TRACKING-START ────────────────────────────────────
;; #lang eopl no expone las hash tables mutables de Racket por su cuenta.
(require racket/base)
(require "_json-value.rkt")
(define _env-log '())
;; Marco (por identidad de su valor `environment`) -> posición que va a tener
;; en el arreglo final de ambientes de este paso, para que una asignación
;; pueda decir a qué marco pertenece la celda que mutó (ver _tracking-assign.rkt).
(define _frame-positions (make-hasheq))
(define (reset-env-log!)
  (set! _env-log '())
  (hash-clear! _frame-positions))
(define (env-log) _env-log)
(define (frame-position-of env) (hash-ref _frame-positions env #f))
;; _in-init-env? queda encendida durante toda la llamada a init-env (ver
;; _tracking-init-env.rkt), no solo hasta el primer extend-env: así un
;; ambiente inicial de varios marcos los rotula todos como init-env.
(define _in-init-env? #f)
(define _orig-empty-env empty-env)
(set! empty-env
  (lambda ()
    (let ([env (_orig-empty-env)])
      (set! _env-log (cons (list 'empty-env '() #f) _env-log))
      env)))
(define _orig-extend-env extend-env)
(set! extend-env
  (lambda (syms vals env)
    (let* ([tag (if _in-init-env? 'init-env 'extend)]
           [new-env (_orig-extend-env syms vals env)]
           ;; Se convierte a JSON aquí, no al final del paso: una clausura o
           ;; una celda capturada por este marco puede mutarse más adelante
           ;; en el mismo paso (set!), y el panel debe mostrar el valor que
           ;; tenía cuando se creó esta ligadura, no el que quede al final.
           [bindings (map (lambda (s v) (cons s (json-value v))) syms vals)])
      ;; La posición se guarda ANTES de agregar esta entrada: es justo el
      ;; índice que va a tener una vez invertido _env-log al final del paso.
      (hash-set! _frame-positions new-env (length _env-log))
      (set! _env-log (cons (list tag (list bindings) #f) _env-log))
      new-env)))
;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────
