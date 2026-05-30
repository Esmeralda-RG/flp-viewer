
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
;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────
