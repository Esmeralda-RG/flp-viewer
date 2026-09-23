
;; ──── FLP-VIEWER-TRACKING-ASSIGN-START ─────────────────────────────
;; Registra las asignaciones (set!) por separado de las ligaduras: apply-env-ref
;; recuerda a qué símbolo corresponde cada referencia que devuelve, para que
;; setref! pueda loguear nombre + valor nuevo cuando muta esa celda in situ.
;; Solo se inyecta en ejemplos cuyo environment.rkt define apply-env-ref/setref!.
;; #lang eopl no expone las hash tables de Racket: se usa una lista asociativa
;; (comparada con eq?, vía assq) ya que las referencias son structs frescas.
(define _ref-syms '())
(define _orig-apply-env-ref apply-env-ref)
(set! apply-env-ref
  (lambda (env sym)
    (let ([ref (_orig-apply-env-ref env sym)])
      (set! _ref-syms (cons (cons ref sym) _ref-syms))
      ref)))
(define _orig-setref! setref!)
(set! setref!
  (lambda (ref val)
    (let* ([found (assq ref _ref-syms)]
           [result (_orig-setref! ref val)])
      (when found
        (set! _env-log (cons (list 'assign (list (list (cons (cdr found) (json-value val))))) _env-log)))
      result)))
;; ──── FLP-VIEWER-TRACKING-ASSIGN-END ───────────────────────────────
