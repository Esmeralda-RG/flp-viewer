#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Procedimientos y cierres
;;; environment.rkt: ambientes como cadena de marcos y ambiente inicial.
;;; Adaptado de 3.InterpretadorProcedimientos.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; Un marco guarda dos listas paralelas: identificadores y valores.
(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido
   (lids (list-of symbol?))
   (lvalue (list-of value?))
   (old-env ambiente?)))

;; Valores denotados: números, booleanos y procedimientos (procval).
(define value?
  (lambda (v)
    #true))

;; buscar-variable : Ambiente x Símbolo -> Valor denotado
;; Recorre los marcos del más reciente al más antiguo.
(define buscar-variable
  (lambda (amb var)
    (cases ambiente amb
      (ambiente-vacio ()
        (eopl:error 'apply-env "No se encuentra la variable ~s" var))
      (ambiente-extendido (lid lval old-env)
        (letrec ([buscar-en-marco
                  (lambda (lid lval)
                    (cond
                      [(null? lid) (buscar-variable old-env var)]
                      [(equal? (car lid) var) (car lval)]
                      [else (buscar-en-marco (cdr lid) (cdr lval))]))])
          (buscar-en-marco lid lval))))))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
(define empty-env
  (lambda ()
    (ambiente-vacio)))

(define extend-env
  (lambda (ids vals amb)
    (ambiente-extendido ids vals amb)))

(define apply-env
  (lambda (amb var)
    (buscar-variable amb var)))

;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.
(define init-env
  (lambda ()
    (extend-env '(x y z a b c) '(4 2 5 4 5 6) (empty-env))))
