
;; ──── FLP-VIEWER-TRACKING-START ────────────────────────────────────
(require "_json-value.rkt")
(define _env-log '())
(define (reset-env-log!) (set! _env-log '()))
(define (env-log) _env-log)
;; _in-init-env? queda encendida durante toda la llamada a init-env (ver
;; _tracking-init-env.rkt), no solo hasta el primer extend-env: así un
;; ambiente inicial de varios marcos los rotula todos como init-env.
(define _in-init-env? #f)
(define _orig-empty-env empty-env)
(set! empty-env
  (lambda ()
    (let ([env (_orig-empty-env)])
      (set! _env-log (cons (list 'empty-env '()) _env-log))
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
      (set! _env-log (cons (list tag (list bindings)) _env-log))
      new-env)))
;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────
