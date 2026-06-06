#lang eopl

(provide (all-defined-out))

;; Cada ligadura guarda su valor en una celda mutable (referencia),
;; lo que permite que 'set' cambie el valor sin crear una nueva ligadura.
(define-datatype environment environment?
  (empty-env-record)
  (extended-env-record
   (syms (list-of symbol?))
   (vec  vector?)
   (env  environment?)))

(define-datatype reference reference?
  (a-ref (pos integer?)
         (vec vector?)))

(define empty-env
  (lambda ()
    (empty-env-record)))

(define extend-env
  (lambda (syms vals env)
    (extended-env-record syms (list->vector vals) env)))

;; Devuelve la referencia (celda) de un identificador, no su valor.
(define apply-env-ref
  (lambda (env sym)
    (cases environment env
      (empty-env-record ()
        (eopl:error 'apply-env "No hay ligadura para ~s" sym))
      (extended-env-record (syms vec saved-env)
        (letrec ([buscar
                  (lambda (ss i)
                    (cond
                      [(null? ss) (apply-env-ref saved-env sym)]
                      [(eqv? (car ss) sym) (a-ref i vec)]
                      [else (buscar (cdr ss) (+ i 1))]))])
          (buscar syms 0))))))

(define deref
  (lambda (ref)
    (cases reference ref
      (a-ref (pos vec) (vector-ref vec pos)))))

(define setref!
  (lambda (ref val)
    (cases reference ref
      (a-ref (pos vec) (vector-set! vec pos val)))))

(define apply-env
  (lambda (env sym)
    (deref (apply-env-ref env sym))))

(define init-env
  (lambda ()
    (empty-env)))
