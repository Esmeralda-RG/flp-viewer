
;; ──── FLP-VIEWER-TRACKING-ASSIGN-START ─────────────────────────────
;; Registra las asignaciones (set!) por separado de las ligaduras: apply-env-ref
;; recuerda a qué símbolo corresponde cada referencia que devuelve, para que
;; setref! pueda loguear nombre + valor nuevo cuando muta esa celda in situ.
;; Solo se inyecta en ejemplos cuyo environment.rkt define apply-env-ref/setref!.
;; #lang eopl no expone las hash tables de Racket: se usa una lista asociativa
;; (comparada con eq?, vía assq) ya que las referencias son structs frescas.
;;
(define _ref-syms '())
(define (find-last-ref ref lst)
  (let loop ([lst lst] [found #f])
    (cond
      [(null? lst) found]
      [(eq? (car (car lst)) ref) (loop (cdr lst) (car lst))]
      [else (loop (cdr lst) found)])))
(define _orig-apply-env-ref apply-env-ref)
(set! apply-env-ref
  (lambda (env sym)
    (let ([ref (_orig-apply-env-ref env sym)])
      (set! _ref-syms (cons (list ref sym env) _ref-syms))
      ref)))
(define _orig-setref! setref!)
(set! setref!
  (lambda (ref val)
    (let* ([found (find-last-ref ref _ref-syms)]
           [result (_orig-setref! ref val)])
      (when found
        (let* ([sym         (cadr found)]
               [owner-env   (caddr found)]
               [frame-index (frame-position-of owner-env)])
          (set! _env-log (cons (list 'assign (list (list (cons sym (json-value val)))) frame-index #f) _env-log))))
      result)))
;; ──── FLP-VIEWER-TRACKING-ASSIGN-END ───────────────────────────────
