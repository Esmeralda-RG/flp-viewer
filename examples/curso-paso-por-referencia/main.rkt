#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Paso por referencia
;;; main.rkt: evaluador; eval-rand decide entre alias (variable) y copia.
;;; Adaptado de 6.InterpretadorAsignacionPasoPorReferencia.rkt para FLP Viewer.
;;; ==================================================================

;; Valores expresados = Número + Booleano + ProcVal
;; Valores denotados  = Ref(Target)

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
      ;; Variable: busca la celda y la dereferencia, con una indirección.
      (var-exp (id) (apply-env amb id))
      ;; Constantes booleanas.
      (true-exp () #true)
      (false-exp () #false)
      ;; Primitiva prefija: evalúa los operandos y aplica la operación.
      (prim-exp (prim args)
        (let ((lvals (map (lambda (x) (evaluar-expresion x amb)) args)))
          (evaluar-primitiva prim lvals)))
      ;; Condicional: la condición tiene que ser booleana.
      (if-exp (condicion hace-verdadero hace-falso)
        (let ((test-value (evaluar-expresion condicion amb)))
          (if (boolean? test-value)
              (if test-value
                  (evaluar-expresion hace-verdadero amb)
                  (evaluar-expresion hace-falso amb))
              (eopl:error 'if-exp
                "La condición del if debe ser booleana, se obtuvo: ~s"
                test-value))))
      ;; Let: celdas nuevas con direct-target; let nunca crea alias.
      (let-exp (ids rands body)
        (let ((lvalues
               (map (lambda (x) (direct-target (evaluar-expresion x amb)))
                    rands)))
          ;; nuevo marco: el panel lo muestra como extend
          (evaluar-expresion body (extend-env ids lvalues amb))))
      ;; Proc: clausura con el ambiente de creación (alcance léxico).
      (proc-exp (ids body)
        (closure ids body amb))
      ;; Aplicación con paso por referencia: los operandos van a eval-rand.
      (app-exp (rator rands)
        (let ((lrands (map (lambda (x) (eval-rand x amb)) rands))
              (procV (evaluar-expresion rator amb)))
          (if (procval? procV)
              (cases procval procV
                (closure (lid body old-env)
                  (if (= (length lid) (length lrands))
                      ;; nuevo marco: el panel lo muestra como extend
                      (evaluar-expresion body (extend-env lid lrands old-env))
                      (eopl:error 'app-exp
                        "Se esperaban ~s argumentos y se recibieron ~s"
                        (length lid) (length lrands)))))
              (eopl:error 'app-exp
                "El operador no evaluó a un procedimiento: ~s" procV))))
      ;; Letrec: marco recursivo cuyas clausuras se ven a sí mismas.
      (letrec-exp (procnames idss cuerpos cuerpo-letrec)
        (evaluar-expresion cuerpo-letrec
          (ambiente-extendido-recursivo procnames idss cuerpos amb)))
      ;; Lista literal: evalúa cada elemento.
      (list-exp (lexp)
        (map (lambda (x) (evaluar-expresion x amb)) lexp))
      ;; Begin: secuenciación; retorna el valor de la última expresión.
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
      ;; Set: asignación; si la celda es un alias, cambia la del llamador.
      ;; Convención del curso: set retorna 1.
      (set-exp (id exp)
        (begin
          ;; asignación de celda: el panel la muestra como asignación
          (setref! (apply-env-ref amb id)
                   (evaluar-expresion exp amb))
          1)))))

;; eval-rand : regla del paso por referencia (EOPL 4.3, figura 4.10).
;; Una variable se pasa como indirect-target hacia su celda; si esa celda ya
;; era un alias, se toma la celda a la que apunta, sin cadenas. Cualquier otra
;; expresión se evalúa y va como direct-target, que es el paso por valor.
(define eval-rand
  (lambda (exp amb)
    (cases expresion exp
      (var-exp (id)
        (indirect-target
         (let ((ref (apply-env-ref amb id)))
           (cases target (primitiva-deref ref)
             (direct-target   (expval) ref)
             (indirect-target (ref1)   ref1)))))
      (else
       (direct-target (evaluar-expresion exp amb))))))

;; evaluar-primitiva : Primitiva x Lista(Valor) -> Valor expresado
(define evaluar-primitiva
  (lambda (prim lval)
    (cases primitiva prim
      (sum-prim        () (operacion-prim lval + 0))
      (minus-prim      () (operacion-prim lval - 0))
      (mult-prim       () (operacion-prim lval * 1))
      (div-prim        () (operacion-prim lval / 1))
      (add-prim        () (+ (car lval) 1))
      (sub-prim        () (- (car lval) 1))
      (mayor-prim      () (>  (car lval) (cadr lval)))
      (mayorigual-prim () (>= (car lval) (cadr lval)))
      (menor-prim      () (<  (car lval) (cadr lval)))
      (menorigual-prim () (<= (car lval) (cadr lval)))
      (igual-prim      () (=  (car lval) (cadr lval))))))

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
