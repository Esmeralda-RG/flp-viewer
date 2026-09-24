#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Intérprete simple con primitivas
;;; grammar.rkt: especificación léxica y gramática SLLGEN del lenguaje.
;;; Adaptado de 2.InterpretadorSimple.rkt para FLP Viewer.
;;; ==================================================================

;; lexical-spec y grammar son los nombres fijos del prototipo; en el curso
;; se llaman especificacion-lexica y especificacion-gramatical.
(provide lexical-spec grammar)

;; Comentarios con %, identificadores que empiezan por letra y números
;; enteros o decimales, positivos o negativos.
(define lexical-spec
  '((espacio-blanco (whitespace) skip)
    (comentario ("%" (arbno (not #\newline))) skip)
    (identificador (letter (arbno (or letter digit "?" "$"))) symbol)
    (numero (digit (arbno digit)) number)
    (numero ("-" digit (arbno digit)) number)
    (numero (digit (arbno digit) "." digit (arbno digit)) number)
    (numero ("-" digit (arbno digit) "." digit (arbno digit)) number)))

;;   <programa>  ::= <expresion>                             a-program(exp)
;;   <expresion> ::= <numero>                                lit-exp(dato)
;;               ::= <identificador>                         var-exp(id)
;;               ::= <primitiva> "(" {<expresion>}*(,) ")"
;;                   prim-exp(prim, args)
;;   <primitiva> ::= + | - | * | / | add1 | sub1
(define grammar
  '((programa (expresion) a-program)
    (expresion (numero) lit-exp)
    (expresion (identificador) var-exp)
    (expresion (primitiva "(" (separated-list expresion ",") ")") prim-exp)
    (primitiva ("+") sum-prim)
    (primitiva ("-") minus-prim)
    (primitiva ("*") mult-prim)
    (primitiva ("/") div-prim)
    (primitiva ("add1") add-prim)
    (primitiva ("sub1") sub-prim)))
