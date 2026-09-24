#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Intérprete simple con primitivas
;;; environment.rkt: ambientes como lista de marcos y ambiente inicial.
;;; Adaptado de 2.InterpretadorSimple.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; Cada marco guarda la lista de identificadores y, en el mismo orden, la de
;; sus valores; old-env es el ambiente encerrado.
(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido
   (lids (list-of symbol?))
   (lvalue (list-of value?))
   (old-env ambiente?)))

;; En este intérprete todo valor de Scheme es un valor denotado válido.
(define value?
  (lambda (v)
    #true))

;; apply-env : Ambiente x Símbolo -> Valor denotado
;; Busca en el marco actual y, si no está, en el ambiente encerrado.
(define apply-env
  (lambda (env var)
    (cases ambiente env
      (ambiente-vacio () (eopl:error "No se encuentra la variable " var))
      (ambiente-extendido (lid lval old-env)
        (letrec
            ((buscar-variable
              (lambda (lid lval old-env)
                (cond
                  [(null? lid) (apply-env old-env var)]
                  [(equal? (car lid) var) (car lval)]
                  [else (buscar-variable (cdr lid) (cdr lval) old-env)]))))
          (buscar-variable lid lval old-env))))))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
;; apply-env se llama igual en el curso y está definido arriba.
(define empty-env
  (lambda ()
    (ambiente-vacio)))

(define extend-env
  (lambda (ids vals amb)
    (ambiente-extendido ids vals amb)))

;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.
(define init-env
  (lambda ()
    (extend-env '(x y z a b c) '(1 2 3 4 5 6) (empty-env))))
