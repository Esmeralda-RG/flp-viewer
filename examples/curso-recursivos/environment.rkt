#lang eopl
;;; ==================================================================
;;; Curso FLP (Univalle) — Procedimientos recursivos con letrec
;;; environment.rkt: ambientes, clausuras y el marco recursivo de letrec.
;;; Adaptado de InterpretadorRecursivos.rkt para FLP Viewer.
;;; ==================================================================

(provide (all-defined-out))

;; Un marco guarda dos listas paralelas: identificadores y valores.
(define-datatype ambiente ambiente?
  (ambiente-vacio)
  (ambiente-extendido
   (lids (list-of symbol?))
   (lvalue (list-of value?))
   (old-env ambiente?)))

;; Valores denotados: números, booleanos y procedimientos.
(define value?
  (lambda (v)
    #true))

;; Clausura: parámetros, cuerpo y ambiente de creación. body es una expresión
;; del AST, que SLLGEN genera en main.rkt; este módulo no ve expresion?, así
;; que se acepta con always?.
(define-datatype procval procval?
  (closure (lid (list-of symbol?))
           (body always?)
           (amb-creation ambiente?)))

;; Lo que letrec liga en su marco: parámetros y cuerpo, todavía sin ambiente.
(define-datatype procedimiento-recursivo procedimiento-recursivo?
  (proc-recursivo (lid (list-of symbol?))
                  (body always?)))

;; En el curso, ambiente-extendido-recursivo es una variante de ambiente.
;; Aquí es un marco común que liga cada nombre a un proc-recursivo, para que
;; el panel lo registre; la clausura se genera igual, en apply-env.
(define ambiente-extendido-recursivo
  (lambda (procnames idss cuerpos old-env)
    ;; nuevo marco: el panel lo muestra como extend
    (extend-env procnames (map proc-recursivo idss cuerpos) old-env)))

;; apply-env : Ambiente x Símbolo -> Valor denotado
(define apply-env
  (lambda (env var)
    (cases ambiente env
      (ambiente-vacio ()
        (eopl:error "No se encuentra la variable " var))
      (ambiente-extendido (lid lval old-env)
        (letrec ([buscar-variable
                  (lambda (lid lval)
                    (cond
                      [(null? lid) (apply-env old-env var)]
                      [(equal? (car lid) var) (abrir (car lval) env)]
                      [else (buscar-variable (cdr lid) (cdr lval))]))])
          (buscar-variable lid lval))))))

;; Un proc-recursivo se vuelve clausura al buscarlo. Su ambiente de creación
;; es env, el marco que lo contiene, y no old-env: así el cuerpo ve su propio
;; nombre y el de los demás procedimientos del mismo letrec.
(define abrir
  (lambda (valor env)
    (if (procedimiento-recursivo? valor)
        (cases procedimiento-recursivo valor
          (proc-recursivo (lid body) (closure lid body env)))
        valor)))

;; Puntos de entrada que el visor rastrea (nombres fijos del prototipo)
;; apply-env se llama igual en el curso y está definido arriba.
(define empty-env
  (lambda ()
    (ambiente-vacio)))

(define extend-env
  (lambda (ids vals amb)
    (ambiente-extendido ids vals amb)))

;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.
(define init-env
  (lambda ()
    (extend-env '(x y z a b c) '(4 2 5 4 5 6) (empty-env))))
