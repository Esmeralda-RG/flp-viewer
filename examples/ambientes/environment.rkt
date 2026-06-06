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

;; Busca el identificador de adentro hacia afuera en la cadena de frames.
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

;; Ambiente inicial con variables predefinidas (x=1, y=2, z=3),
;; útil para observar la búsqueda y el shadowing.
(define init-env
  (lambda ()
    (extend-env '(x y z) '(1 2 3) (empty-env))))
