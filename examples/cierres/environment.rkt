#lang eopl

(provide (all-defined-out))

(define-datatype environment environment?
  (empty-env-record)
  (extended-env-record
   (syms (list-of symbol?))
   (vals list?)
   (env environment?)))

(define empty-env
  (lambda ()
    (empty-env-record)))

(define extend-env
  (lambda (syms vals env)
    (extended-env-record syms vals env)))

(define apply-env
  (lambda (env sym)
    (cases environment env
      (empty-env-record ()
        (eopl:error 'apply-env "No hay ligadura para ~s" sym))
      (extended-env-record (syms vals saved-env)
        (letrec ([buscar
                  (lambda (ss vs)
                    (cond
                      [(null? ss) (apply-env saved-env sym)]
                      [(eqv? (car ss) sym) (car vs)]
                      [else (buscar (cdr ss) (cdr vs))]))])
          (buscar syms vals))))))

(define init-env
  (lambda ()
    (empty-env)))
