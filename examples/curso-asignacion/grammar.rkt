#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Asignación y referencias
;;; grammar.rkt: especificación léxica y gramatical del lenguaje.
;;; Adaptado de 5.InterpretadorAsignacion.rkt para FLP Viewer.
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

    ;; Núcleo LET
    (expresion (numero) lit-exp)
    (expresion (identificador) var-exp)
    (expresion ("true") true-exp)
    (expresion ("false") false-exp)
    (expresion ("if" expresion "then" expresion "else" expresion) if-exp)
    (expresion ("let" (arbno identificador "=" expresion) "in" expresion)
               let-exp)

    ;; Procedimientos
    (expresion ("proc" "(" (separated-list identificador ",") ")" expresion)
               proc-exp)
    (expresion ("(" expresion (arbno expresion) ")") app-exp)

    ;; Procedimientos recursivos
    (expresion ("letrec"
                (arbno identificador
                       "(" (separated-list identificador ",") ")"
                       "=" expresion)
                "in" expresion)
               letrec-exp)

    ;; Asignación: begin secuencia expresiones, set escribe en una celda
    (expresion ("begin" expresion (arbno ";" expresion) "end") begin-exp)
    (expresion ("set" identificador "=" expresion) set-exp)

    ;; Primitivas prefijas
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
