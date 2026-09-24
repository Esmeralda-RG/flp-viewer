#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Paso por referencia
;;; environment.rkt: TAD target, TAD referencia y ambiente de targets.
;;; Adaptado de 6.InterpretadorAsignacionPasoPorReferencia.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; --- TAD target ---------------------------------------------------------
;; Target = direct-target(ExpVal)   celda con valor propio
;;        | indirect-target(Ref)    alias de la celda de otra variable
;; Invariante: un indirect-target apunta siempre a un direct-target.

(define-datatype target target?
  (direct-target   (expval expval?))
  (indirect-target (ref    ref-to-direct-target?)))

;; ExpVal = Int + Bool + Proc
(define expval?
  (lambda (x)
    (or (boolean? x) (number? x) (procval? x))))

(define ref-to-direct-target?
  (lambda (x)
    (and (referencia? x)
         (cases referencia x
           (a-ref (pos vec)
             (cases target (vector-ref vec pos)
               (direct-target   (v) #t)
               (indirect-target (v) #f)))))))

;; --- TAD referencia -----------------------------------------------------
;; Una referencia es una posición en el vector de un marco.

(define-datatype referencia referencia?
  (a-ref (pos number?)
         (vec vector?)))

;; primitiva-deref : contenido crudo de la celda, un target.
(define primitiva-deref
  (lambda (ref)
    (cases referencia ref
      (a-ref (pos vec) (vector-ref vec pos)))))

;; deref : Ref -> ExpVal. Sigue a lo sumo una indirección.
(define deref
  (lambda (ref)
    (cases target (primitiva-deref ref)
      (direct-target   (exp) exp)
      (indirect-target (ref1)
        (cases target (primitiva-deref ref1)
          (direct-target   (exp1) exp1)
          (indirect-target (p)
            (eopl:error 'deref
              "indirect-target apunta a otro indirect-target: ~s" ref1)))))))

;; primitiva-setref! : escritura cruda en la celda.
(define primitiva-setref!
  (lambda (ref val)
    (cases referencia ref
      (a-ref (pos vec) (vector-set! vec pos val)))))

;; setref! : Ref x ExpVal -> Unit. Si la celda es indirecta, escribe en la
;; celda apuntada. El curso lo hace con una escritura cruda; aquí se vuelve a
;; pasar por setref!, con el mismo efecto, para que el panel registre también
;; la variable del llamador.
(define setref!
  (lambda (ref val)
    (cases target (primitiva-deref ref)
      (direct-target   (exp)  (primitiva-setref! ref (direct-target val)))
      (indirect-target (ref2) (setref! ref2 val)))))

;; --- TAD valor procedimental --------------------------------------------
;; body es una expresión del AST, que SLLGEN genera en main.rkt; este módulo
;; no ve expresion?, así que se acepta con always?.

(define-datatype procval procval?
  (closure (lid (list-of symbol?))
           (body always?)
           (amb-creation ambiente?)))

;; --- TAD ambiente -------------------------------------------------------
;; Cada marco guarda sus targets en un vector; cada celda es una referencia.

(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido-ref
   (lids (list-of symbol?))
   (lvalue vector?)
   (old-env ambiente?)))

;; ambiente-extendido : recibe la lista de targets y la guarda en un vector.
(define ambiente-extendido
  (lambda (lids lvalue old-env)
    (ambiente-extendido-ref lids (list->vector lvalue) old-env)))

;; ambiente-extendido-recursivo : atado mutable. El marco nace con celdas
;; provisionales y después cada celda recibe su clausura sobre ese marco.
(define ambiente-extendido-recursivo
  (lambda (procnames lidss cuerpos old-env)
    ;; nuevo marco: el panel lo muestra como extend
    (let ((amb (extend-env procnames
                           (map (lambda (p) (direct-target 0)) procnames)
                           old-env)))
      (for-each
       (lambda (nombre lid cuerpo)
         (primitiva-setref! (apply-env-ref amb nombre)
                            (direct-target (closure lid cuerpo amb))))
       procnames lidss cuerpos)
      amb)))

;; apply-env-ref : retorna la referencia (celda) del identificador.
;; La usan set y eval-rand.
(define apply-env-ref
  (lambda (env var)
    (cases ambiente env
      (ambiente-vacio ()
        (eopl:error 'apply-env-ref "No se encuentra la variable: ~s" var))
      (ambiente-extendido-ref (lid vec old-env)
        (letrec
            ((buscar-variable
              (lambda (lid vec pos)
                (cond
                  [(null? lid) (apply-env-ref old-env var)]
                  [(equal? (car lid) var) (a-ref pos vec)]
                  [else (buscar-variable (cdr lid) vec (+ pos 1))]))))
          (buscar-variable lid vec 0))))))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
(define empty-env
  (lambda ()
    (ambiente-vacio)))

(define extend-env
  (lambda (ids vals amb)
    (ambiente-extendido ids vals amb)))

;; apply-env busca la celda y la dereferencia: devuelve el valor del target.
(define apply-env
  (lambda (amb var)
    (deref (apply-env-ref amb var))))

;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.
(define init-env
  (lambda ()
    (extend-env '(x y z a b c)
                (map direct-target '(1 2 3 4 5 6))
                (empty-env))))
