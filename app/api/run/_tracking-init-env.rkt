
;; ──── FLP-VIEWER-TRACKING-INIT-ENV-START ───────────────────────────
;; Solo se inyecta cuando environment.rkt define init-env como procedimiento,
;; (define init-env (lambda ...)). Los intérpretes del curso que lo definen
;; en main.rkt o como un valor ya construido (no un procedimiento) rompían
;; con "init-env: unbound identifier" o "cases: not a environment" si se
;; envolvían igual; route.ts solo inyecta este bloque cuando es seguro.
(define _orig-init-env init-env)
(set! init-env
  (lambda ()
    (set! _in-init-env? #t)
    (let ([env (_orig-init-env)])
      (set! _in-init-env? #f)
      env)))
;; ──── FLP-VIEWER-TRACKING-INIT-ENV-END ─────────────────────────────
