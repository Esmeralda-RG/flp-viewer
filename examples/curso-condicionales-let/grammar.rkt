#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Condicionales y let
;;; grammar.rkt: especificación léxica y gramática SLLGEN del lenguaje.
;;; Adaptado de 3.InterpretadorCondicionalesYLigadura.rkt para FLP Viewer.
;;; ==================================================================

;; lexical-spec y grammar son los nombres fijos del prototipo; en el curso
;; se llaman especificacion-lexica y especificacion-gramatical.
(provide lexical-spec grammar)

(define lexical-spec
  '((espacio-blanco (whitespace) skip)
    ;; Comentarios: desde % hasta el fin de la línea
    (comentario ("%" (arbno (not #\newline))) skip)
    (identificador (letter (arbno (or letter digit "?" "$"))) symbol)
    ;; Enteros y decimales, positivos y negativos
    (numero (digit (arbno digit)) number)
    (numero ("-" digit (arbno digit)) number)
    (numero (digit (arbno digit) "." digit (arbno digit)) number)
    (numero ("-" digit (arbno digit) "." digit (arbno digit)) number)))

;;   <programa>  ::= <expresion>
;;                   a-program(exp)
;;   <expresion> ::= <numero>
;;                   lit-exp(dato)
;;               ::= <identificador>
;;                   var-exp(id)
;;               ::= "true"
;;                   true-exp()
;;               ::= "false"
;;                   false-exp()
;;               ::= "if" <expresion> "then" <expresion> "else" <expresion>
;;                   if-exp(condicion, consecuente, alternativa)
;;               ::= "let" {<identificador> "=" <expresion>}* "in" <expresion>
;;                   let-exp(ids, rands, body)
;;               ::= <primitiva> "(" {<expresion>}*(,) ")"
;;                   prim-exp(prim, args)
;;   <primitiva> ::= + | - | * | / | add1 | sub1 | > | >= | < | <= | ==
(define grammar
  '((programa (expresion) a-program)
    (expresion (numero) lit-exp)
    (expresion (identificador) var-exp)
    (expresion ("true") true-exp)
    (expresion ("false") false-exp)
    (expresion ("if" expresion "then" expresion "else" expresion) if-exp)
    ;; Cero o más ligaduras id = exp antes del in
    (expresion ("let" (arbno identificador "=" expresion) "in" expresion)
               let-exp)
    (expresion (primitiva "(" (separated-list expresion ",") ")") prim-exp)
    (primitiva ("+") sum-prim)
    (primitiva ("-") minus-prim)
    (primitiva ("*") mult-prim)
    (primitiva ("/") div-prim)
    (primitiva ("add1") add-prim)
    (primitiva ("sub1") sub-prim)
    ;; Comparaciones: producen booleanos para la condición del if
    (primitiva (">") mayor-prim)
    (primitiva (">=") mayorigual-prim)
    (primitiva ("<") menor-prim)
    (primitiva ("<=") menorigual-prim)
    (primitiva ("==") igual-prim)))
