#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Condicionales y let
;;; main.rkt: evaluador con booleanos, if-then-else, let y comparaciones.
;;; Adaptado de 3.InterpretadorCondicionalesYLigadura.rkt para FLP Viewer.
;;; ==================================================================

;; Valores expresados = Número + Booleano
;; Valores denotados  = Número + Booleano

(provide (all-defined-out))

(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

;; evaluar-programa : Programa -> Valor expresado
(define evaluar-programa
  (lambda (pgm)
    (cases programa pgm
      (a-program (exp) (evaluar-expresion exp (init-env))))))

;; evaluar-expresion : Expresión x Ambiente -> Valor expresado
(define evaluar-expresion
  (lambda (exp amb)
    (cases expresion exp
      ;; Literal: el número es su propio valor.
      (lit-exp (dato) dato)
      ;; Variable: su valor denotado se busca en el ambiente.
      (var-exp (id) (apply-env amb id))
      ;; Booleanos: nuevos valores expresados del lenguaje.
      (true-exp () #true)
      (false-exp () #false)
      ;; Primitiva: evalúa los argumentos y aplica la operación.
      (prim-exp (prim args)
        (let ((lista-numeros
               (map (lambda (x) (evaluar-expresion x amb)) args)))
          (evaluar-primitiva prim lista-numeros)))
      ;; Condicional: la condición debe ser booleana y corre una sola rama.
      (if-exp (condicion hace-verdadero hace-falso)
        (let ((test-value (evaluar-expresion condicion amb)))
          (if (boolean? test-value)
              (if test-value
                  (evaluar-expresion hace-verdadero amb)
                  (evaluar-expresion hace-falso amb))
              (eopl:error "El test-exp debe ser un booleano " condicion))))
      ;; Ligadura local: los rands se evalúan en amb, así que las
      ;; ligaduras del mismo let no se ven entre sí.
      (let-exp (ids rands body)
        (let ((lvalues (map (lambda (x) (evaluar-expresion x amb)) rands)))
          ;; nuevo marco: el panel lo muestra como extend
          (evaluar-expresion body (extend-env ids lvalues amb)))))))

;; evaluar-primitiva : Primitiva x Lista(Valor) -> Valor expresado
(define evaluar-primitiva
  (lambda (prim lval)
    (cases primitiva prim
      (sum-prim () (operacion-prim lval + 0))
      (minus-prim () (- (car lval) (operacion-prim (cdr lval) + 0)))
      (mult-prim () (operacion-prim lval * 1))
      (div-prim () (/ (car lval) (operacion-prim lval * 1)))
      (add-prim () (+ (car lval) 1))
      (sub-prim () (- (car lval) 1))
      (mayor-prim () (> (car lval) (cadr lval)))
      (mayorigual-prim () (>= (car lval) (cadr lval)))
      (menor-prim () (< (car lval) (cadr lval)))
      (menorigual-prim () (<= (car lval) (cadr lval)))
      (igual-prim () (= (car lval) (cadr lval))))))

;; operacion-prim : Lista(Valor) x Operación x Valor neutro -> Número
;; Plegado a la derecha: (operacion-prim '(2 3 4) + 0) = 2 + (3 + (4 + 0))
(define operacion-prim
  (lambda (lval op term)
    (cond
      [(null? lval) term]
      [else (op (car lval) (operacion-prim (cdr lval) op term))])))

;; REPL del curso; en DrRacket se inicia con (interpretador).
(define interpretador
  (sllgen:make-rep-loop "-->" evaluar-programa
                        (sllgen:make-stream-parser lexical-spec grammar)))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
(define eval-program
  (lambda (pgm)
    (evaluar-programa pgm)))
