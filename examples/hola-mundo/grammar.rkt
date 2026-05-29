#lang eopl

(provide lexical-spec grammar)

(define lexical-spec
  '((whitespace
     (whitespace) skip)
    (comment
     ("//" (arbno (not #\newline))) skip)
    (identifier
     (letter (arbno (or letter digit "?"))) symbol)))

(define grammar
  '(
    (program (expression) a-program)

    ;; Imprime el valor de una expresión
    (expression ("print" expression) print-exp)

    ;; Cadena de texto entre comillas: "hola mundo"
    (expression ("\"" identifier (arbno identifier) "\"") string-exp)
  ))
