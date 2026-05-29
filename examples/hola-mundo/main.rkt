#lang eopl
(provide (all-defined-out))

(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

; Parser: convierte texto en AST
(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

; Uso interneo para depurar el front-end
(define stream-parser
  (sllgen:make-stream-parser lexical-spec grammar))

; Define stream-parser como efecto secundario de sllgen:make-rep-loop
(define interpreter
  (sllgen:make-rep-loop "--> "
    (lambda (pgm) (eval-program pgm))
    (sllgen:make-stream-parser lexical-spec grammar)))


; eval-program: <program> -> valor
(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (exp)
        (eval-expression exp (init-env))))))

; eval-expression: <expression> <environment> -> valor
(define eval-expression
  (lambda (exp env)
    (cases expression exp

      ; print devuelve el valor de la expresión
      (print-exp (e)
        (eval-expression e env))

      ; "hola mundo" -> string "hola mundo"
      (string-exp (id1 ids)
        (apply string-append
          (cons (symbol->string id1)
                (map (lambda (id) (string-append " " (symbol->string id)))
                     ids)))))))
