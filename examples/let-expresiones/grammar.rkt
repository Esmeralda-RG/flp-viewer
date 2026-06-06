#lang eopl

(provide lexical-spec grammar)

(define lexical-spec
  '((whitespace (whitespace) skip)
    (comment ("//" (arbno (not #\newline))) skip)
    (identifier (letter (arbno (or letter digit "?"))) symbol)
    (number (digit (arbno digit)) number)))

;; El nombre al final de cada regla es el constructor del nodo del AST.
(define grammar
  '((program (expression) a-program)
    (expression (number) lit-exp)
    (expression (identifier) var-exp)
    (expression ("-" "(" expression "," expression ")") diff-exp)
    (expression ("zero?" "(" expression ")") zero?-exp)
    (expression ("if" expression "then" expression "else" expression) if-exp)
    (expression ("let" identifier "=" expression "in" expression) let-exp)))
