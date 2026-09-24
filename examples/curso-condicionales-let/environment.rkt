#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Condicionales y let
;;; environment.rkt: ambientes con datatype y ambiente inicial.
;;; Adaptado de 3.InterpretadorCondicionalesYLigadura.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; Un let agrega un marco delante del ambiente actual y deja intacto el
;; anterior:  let w = 10 in +(w, x)  evalúa el cuerpo en  [w=10] -> amb.
(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido
   (lids (list-of symbol?))
   (lvalue (list-of value?))
   (old-env ambiente?)))

;; value? : SchemeVal -> Bool
;; Números y booleanos son valores denotados en este intérprete.
(define value?
  (lambda (v)
    #true))

;; buscar-variable : Ambiente x Símbolo -> Valor denotado
;; Recorre los marcos del más reciente al más antiguo: el primero que
;; liga la variable gana, y así un let tapa las ligaduras de afuera.
(define buscar-variable
  (lambda (env var)
    (cases ambiente env
      (ambiente-vacio () (eopl:error "No se encuentra la variable " var))
      (ambiente-extendido (lid lval old-env)
        (letrec
            ((buscar-en-marco
              (lambda (lid lval)
                (cond
                  [(null? lid) (buscar-variable old-env var)]
                  [(equal? (car lid) var) (car lval)]
                  [else (buscar-en-marco (cdr lid) (cdr lval))]))))
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
