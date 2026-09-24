#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Procedimientos y cierres
;;; main.rkt: evaluador con procedimientos de primera clase y clausuras.
;;; Adaptado de 3.InterpretadorProcedimientos.rkt para FLP Viewer.
;;; ==================================================================

;; Valores expresados = Número + Booleano + ProcVal
;; Valores denotados  = Número + Booleano + ProcVal

(provide (all-defined-out))

(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

;; Clausura: parámetros, cuerpo y ambiente de creación.
(define-datatype procval procval?
  (closure (lid (list-of symbol?))
           (body expresion?)
           (amb-creation ambiente?)))

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
      ;; Variable: se busca en la cadena de marcos.
      (var-exp (id) (apply-env amb id))
      ;; Booleanos del lenguaje.
      (true-exp () #true)
      (false-exp () #false)
      ;; Primitiva: se evalúan los argumentos y se aplica la operación.
      (prim-exp (prim args)
        (evaluar-primitiva prim
          (map (lambda (x) (evaluar-expresion x amb)) args)))
      ;; Condicional: la prueba tiene que dar un booleano.
      (if-exp (condicion hace-verdadero hace-falso)
        (let ([test-value (evaluar-expresion condicion amb)])
          (if (boolean? test-value)
              (if test-value
                  (evaluar-expresion hace-verdadero amb)
                  (evaluar-expresion hace-falso amb))
              (eopl:error 'if-exp "El test-exp debe ser un booleano: ~s"
                          test-value))))
      ;; let múltiple: las partes derechas se evalúan en amb, antes de ligar.
      (let-exp (ids rands body)
        (let ([lvalues (map (lambda (x) (evaluar-expresion x amb)) rands)])
          ;; nuevo marco: el panel lo muestra como extend
          (evaluar-expresion body (extend-env ids lvalues amb))))
      ;; proc: crea una clausura que captura el ambiente actual.
      (proc-exp (ids body)
        (closure ids body amb))
      ;; Aplicación: alcance estático, el cuerpo extiende el ambiente
      ;; capturado en la clausura y no el de la llamada.
      (app-exp (rator rands)
        (let ([lrands (map (lambda (x) (evaluar-expresion x amb)) rands)]
              [procV (evaluar-expresion rator amb)])
          (if (procval? procV)
              (cases procval procV
                (closure (lid body old-env)
                  (if (= (length lid) (length lrands))
                      ;; nuevo marco: el panel lo muestra como extend
                      (evaluar-expresion body (extend-env lid lrands old-env))
                      (eopl:error 'app-exp
                        (string-append "El número de argumentos no es correcto,"
                                       " debe enviar ~s y usted ha enviado ~s")
                        (length lid) (length lrands)))))
              (eopl:error 'app-exp
                "No puede evaluarse algo que no sea un procedimiento: ~s"
                procV)))))))

;; evaluar-primitiva : Primitiva x Lista(Valor) -> Valor expresado
(define evaluar-primitiva
  (lambda (prim lval)
    (cases primitiva prim
      (sum-prim () (operacion-prim lval + 0))
      (minus-prim () (- (car lval) (operacion-prim (cdr lval) + 0)))
      (mult-prim () (operacion-prim lval * 1))
      (div-prim () (/ (car lval) (operacion-prim (cdr lval) * 1)))
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
    (if (null? lval)
        term
        (op (car lval) (operacion-prim (cdr lval) op term)))))

;; REPL del curso; en DrRacket se inicia con (interpretador).
(define interpretador
  (sllgen:make-rep-loop "-->" evaluar-programa
                        (sllgen:make-stream-parser lexical-spec grammar)))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
(define eval-program
  (lambda (pgm)
    (evaluar-programa pgm)))
