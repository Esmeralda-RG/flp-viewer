#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Procedimientos y cierres
;;; grammar.rkt: especificación léxica y gramática, sin cambios.
;;; Adaptado de 3.InterpretadorProcedimientos.rkt para FLP Viewer.
;;; ==================================================================

;; lexical-spec y grammar son los nombres fijos del prototipo; en el curso
;; se llaman especificacion-lexica y especificacion-gramatical.
(provide lexical-spec grammar)

(define lexical-spec
  '((espacio-blanco (whitespace) skip)
    (comentario ("%" (arbno (not #\newline))) skip)
    (identificador (letter (arbno (or letter digit "?" "$"))) symbol)
    (numero (digit (arbno digit)) number)
    (numero ("-" digit (arbno digit)) number)
    (numero (digit (arbno digit) "." digit (arbno digit)) number)
    (numero ("-" digit (arbno digit) "." digit (arbno digit)) number)))

(define grammar
  '((programa (expresion) a-program)
    (expresion (numero) lit-exp)
    (expresion (identificador) var-exp)
    (expresion ("true") true-exp)
    (expresion ("false") false-exp)
    (expresion ("if" expresion "then" expresion "else" expresion) if-exp)
    (expresion ("let" (arbno identificador "=" expresion) "in" expresion)
               let-exp)
    ;; proc(x, y) cuerpo: parámetros separados por coma
    (expresion ("proc" "(" (separated-list identificador ",") ")" expresion)
               proc-exp)
    ;; (f a b): operador y operandos separados por espacio
    (expresion ("(" expresion (arbno expresion) ")") app-exp)
    (expresion (primitiva "(" (separated-list expresion ",") ")") prim-exp)
    (primitiva ("+") sum-prim)
    (primitiva ("-") minus-prim)
    (primitiva ("*") mult-prim)
    (primitiva ("/") div-prim)
    (primitiva ("add1") add-prim)
    (primitiva ("sub1") sub-prim)
    (primitiva (">") mayor-prim)
    (primitiva (">=") mayorigual-prim)
    (primitiva ("<") menor-prim)
    (primitiva ("<=") menorigual-prim)
    (primitiva ("==") igual-prim)))
