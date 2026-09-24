#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Asignación y referencias
;;; environment.rkt: TAD referencia y TAD ambiente con celdas mutables.
;;; Adaptado de 5.InterpretadorAsignacion.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; En IMPLICIT-REFS el ambiente liga cada identificador con una referencia:
;; cada marco guarda sus valores en un vector y cada celda es una referencia.

;; --- TAD referencia -----------------------------------------------------

(define-datatype referencia referencia?
  (a-ref (pos number?)
         (vec vector?)))

;; deref : Ref(ExpVal) -> ExpVal
(define deref
  (lambda (ref)
    (cases referencia ref
      (a-ref (pos vec) (vector-ref vec pos)))))

;; setref! : Ref(ExpVal) x ExpVal -> Unit
(define setref!
  (lambda (ref val)
    (cases referencia ref
      (a-ref (pos vec) (vector-set! vec pos val)))))

;; --- TAD ambiente -------------------------------------------------------

(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido-ref
   (lids (list-of symbol?))
   (lvalue vector?)
   (old-env ambiente?)))

;; ambiente-extendido : Ids x Vals x Ambiente -> Ambiente
(define ambiente-extendido
  (lambda (lids lvalue old-env)
    (ambiente-extendido-ref lids (list->vector lvalue) old-env)))

;; apply-env-ref : Ambiente x Id -> Ref
;; Conserva el nombre del curso; el visor lo rastrea junto con setref!.
(define apply-env-ref
  (lambda (env var)
    (cases ambiente env
      (ambiente-vacio ()
        (eopl:error 'apply-env-ref "No se encuentra la variable: ~s" var))
      (ambiente-extendido-ref (lid vec old-env)
        (letrec
            ((buscar-variable
              (lambda (lid vec pos)
                (cond
                  [(null? lid) (apply-env-ref old-env var)]
                  [(equal? (car lid) var) (a-ref pos vec)]
                  [else (buscar-variable (cdr lid) vec (+ pos 1))]))))
          (buscar-variable lid vec 0))))))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
(define empty-env
  (lambda ()
    (ambiente-vacio)))

(define extend-env
  (lambda (ids vals amb)
    (ambiente-extendido ids vals amb)))

(define apply-env
  (lambda (amb var)
    (deref (apply-env-ref amb var))))

;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.
(define init-env
  (lambda ()
    (extend-env '(x y z a b c) '(4 2 5 4 5 6) (empty-env))))
