#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Asignación y referencias
;;; main.rkt: evaluador con begin, set y referencias implícitas.
;;; Adaptado de 5.InterpretadorAsignacion.rkt para FLP Viewer.
;;; ==================================================================

;; Valores expresados = Número + Booleano + ProcVal
;; Valores denotados  = Ref(Valor expresado)

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

;; ambiente-extendido-recursivo : atado mutable para letrec.
;; Crea el marco con las celdas en 0 y después escribe en ellas las
;; clausuras, que capturan ese mismo marco. Vive aquí porque construye
;; clausuras, y procval se define en este archivo.
(define ambiente-extendido-recursivo
  (lambda (procnames lidss cuerpos old-env)
    ;; nuevo marco: el panel lo muestra como extend, con las celdas en 0
    (let ((amb (extend-env procnames (map (lambda (p) 0) procnames) old-env)))
      (cases ambiente amb
        (ambiente-extendido-ref (lids vec old)
          (letrec
              ((obtener-clausuras
                (lambda (lidss cuerpos pos)
                  (cond
                    [(null? lidss) amb]
                    [else
                     (vector-set! vec pos
                                  (closure (car lidss) (car cuerpos) amb))
                     (obtener-clausuras (cdr lidss) (cdr cuerpos)
                                        (+ pos 1))]))))
            (obtener-clausuras lidss cuerpos 0)))
        (else amb)))))

;; evaluar-programa : Programa -> Valor expresado
(define evaluar-programa
  (lambda (pgm)
    (cases programa pgm
      (a-program (exp) (evaluar-expresion exp (init-env))))))

;; evaluar-expresion : Expresión x Ambiente -> Valor expresado
(define evaluar-expresion
  (lambda (exp amb)
    (cases expresion exp
      ;; Literal: el número se devuelve tal cual.
      (lit-exp (dato) dato)
      ;; Variable: busca la referencia y la dereferencia.
      (var-exp (id) (apply-env amb id))
      ;; Booleanos del lenguaje.
      (true-exp () #true)
      (false-exp () #false)
      ;; Primitiva: evalúa los operandos y aplica el operador.
      (prim-exp (prim args)
        (let ((lvals (map (lambda (x) (evaluar-expresion x amb)) args)))
          (evaluar-primitiva prim lvals)))
      ;; Condicional: la condición debe ser booleana.
      (if-exp (condicion hace-verdadero hace-falso)
        (let ((test-value (evaluar-expresion condicion amb)))
          (if (boolean? test-value)
              (if test-value
                  (evaluar-expresion hace-verdadero amb)
                  (evaluar-expresion hace-falso amb))
              (eopl:error 'if-exp
                (string-append "La condición de un if debe evaluarse "
                               "a un booleano, se obtuvo: ~s")
                test-value))))
      ;; Ligadura local: cada identificador recibe una celda fresca.
      (let-exp (ids rands body)
        (let ((lvalues (map (lambda (x) (evaluar-expresion x amb)) rands)))
          ;; nuevo marco: el panel lo muestra como extend
          (evaluar-expresion body (extend-env ids lvalues amb))))
      ;; Abstracción: la clausura guarda el ambiente de creación.
      (proc-exp (ids body)
        (closure ids body amb))
      ;; Aplicación: paso por valor, celdas nuevas para los parámetros.
      (app-exp (rator rands)
        (let ((lrands (map (lambda (x) (evaluar-expresion x amb)) rands))
              (procV (evaluar-expresion rator amb)))
          (if (procval? procV)
              (cases procval procV
                (closure (lid body old-env)
                  (if (= (length lid) (length lrands))
                      ;; nuevo marco: el panel lo muestra como extend
                      (evaluar-expresion body
                                         (extend-env lid lrands old-env))
                      (eopl:error 'app-exp
                        (string-append "Número de argumentos incorrecto: "
                                       "se esperaban ~s y se recibieron ~s")
                        (length lid) (length lrands)))))
              (eopl:error 'app-exp
                "El operador no evaluó a un procedimiento: ~s" procV))))
      ;; Recursión: las clausuras se ven a sí mismas por el atado mutable.
      (letrec-exp (procnames idss cuerpos cuerpo-letrec)
        (evaluar-expresion cuerpo-letrec
          (ambiente-extendido-recursivo procnames idss cuerpos amb)))
      ;; Secuenciación: evalúa en orden y devuelve el valor de la última.
      (begin-exp (exp lexp)
        (letrec
            ((evaluar-secuencia
              (lambda (primera resto)
                (if (null? resto)
                    (evaluar-expresion primera amb)
                    (begin
                      (evaluar-expresion primera amb)
                      (evaluar-secuencia (car resto) (cdr resto)))))))
          (evaluar-secuencia exp lexp)))
      ;; Asignación: no crea marco, escribe en la celda existente de id.
      ;; Convención del curso: set devuelve 1.
      (set-exp (id exp)
        (begin
          ;; asignación de celda: el panel la muestra como asignación
          (setref! (apply-env-ref amb id)
                   (evaluar-expresion exp amb))
          1)))))

;; evaluar-primitiva : Primitiva x Lista(Valor) -> Valor expresado
(define evaluar-primitiva
  (lambda (prim lval)
    (cases primitiva prim
      (sum-prim () (operacion-prim lval + 0))
      (minus-prim () (operacion-prim lval - 0))
      (mult-prim () (operacion-prim lval * 1))
      (div-prim () (operacion-prim lval / 1))
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
