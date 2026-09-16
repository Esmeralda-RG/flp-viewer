
;; ──── FLP-VIEWER-TRACKING-START ────────────────────────────────────
(define _env-log '())
(define (reset-env-log!) (set! _env-log '()))
(define (env-log) _env-log)
(define _next-is-init #f)
(define _orig-empty-env empty-env)
(set! empty-env
  (lambda ()
    (let ([env (_orig-empty-env)])
      (set! _env-log (cons (list 'empty-env '()) _env-log))
      (set! _next-is-init #t)
      env)))
(define _orig-extend-env extend-env)
(set! extend-env
  (lambda (syms vals env)
    (let* ([tag (if _next-is-init 'init-env 'extend)]
           [new-env (_orig-extend-env syms vals env)])
      (set! _next-is-init #f)
      (set! _env-log (cons (list tag (list (map cons syms vals))) _env-log))
      new-env)))
;; Si init-env no llama a extend-env (p. ej. (define init-env (lambda () (empty-env))))
;; la bandera _next-is-init queda encendida y el próximo extend-env real —el del
;; primer let/proc del programa— se marcaría por error como 'init-env. Se limpia
;; aquí al salir de init-env, la única fuente legítima de ese ambiente inicial.
(define _orig-init-env init-env)
(set! init-env
  (lambda ()
    (let ([env (_orig-init-env)])
      (set! _next-is-init #f)
      env)))
;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────
