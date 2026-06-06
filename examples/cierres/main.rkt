#lang eopl
(provide (all-defined-out))

(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (exp)
        (eval-expression exp (init-env))))))

(define eval-expression
  (lambda (exp env)
    (cases expression exp
      (lit-exp (n) n)
      (var-exp (id) (apply-env env id))
      (diff-exp (e1 e2)
        (- (eval-expression e1 env)
           (eval-expression e2 env)))
      (zero?-exp (e)
        (if (zero? (eval-expression e env)) #t #f))
      (if-exp (test t f)
        (if (eval-expression test env)
            (eval-expression t env)
            (eval-expression f env)))
      (let-exp (id rhs body)
        (eval-expression body
          (extend-env (list id)
                      (list (eval-expression rhs env))
                      env)))

      ;; El procedimiento se representa como una función Racket que
      ;; recuerda el ambiente de su creación: eso es el cierre.
      (proc-exp (param body)
        (lambda (arg)
          (eval-expression body
            (extend-env (list param) (list arg) env))))

      (call-exp (rator rand)
        (let ([proc (eval-expression rator env)]
              [arg  (eval-expression rand env)])
          (proc arg))))))
