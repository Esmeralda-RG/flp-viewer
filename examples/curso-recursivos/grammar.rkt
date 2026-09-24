#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Procedimientos recursivos con letrec
;;; grammar.rkt: especificación léxica y gramática del lenguaje con letrec.
;;; Adaptado de InterpretadorRecursivos.rkt para FLP Viewer.
;;; ==================================================================

;; lexical-spec y grammar son los nombres fijos del prototipo; en el curso
;; se llaman especificacion-lexica y especificacion-gramatical.
(provide lexical-spec grammar)

(define lexical-spec
  '((espacio-blanco (whitespace) skip)
    ;; Comentarios: desde % hasta el fin de la línea
    (comentario ("%" (arbno (not #\newline))) skip)
    ;; Identificadores: letra seguida de letras, dígitos, ? o $
    (identificador (letter (arbno (or letter digit "?" "$"))) symbol)
    ;; Números enteros y decimales, positivos y negativos
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

    ;; Procedimientos: proc(x, y) cuerpo  y  (rator rand1 rand2 ...)
    (expresion ("proc" "(" (separated-list identificador ",") ")" expresion)
               proc-exp)
    (expresion ("(" expresion (arbno expresion) ")") app-exp)

    ;; letrec f(x, y) = <cuerpo de f>  g(m, n) = <cuerpo de g>  in <exp>
    (expresion ("letrec"
                (arbno identificador
                       "(" (separated-list identificador ",") ")"
                       "=" expresion)
                "in" expresion)
               letrec-exp)

    ;; Primitivas prefijas: +(x, y), sub1(n), ==(n, 0)
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
