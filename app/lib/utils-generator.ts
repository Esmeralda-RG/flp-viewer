export function generateUtilsRkt(): string {
  return `#lang racket

;;; ============================================================
;;; utils.rkt — Utilidades generadas por FLP Viewer
;;; Universidad del Valle — Intérprete Educativo
;;; ============================================================

(provide (all-defined-out))

;; -----------------------------------------------------------
;; Conversión de tipos
;; -----------------------------------------------------------

;;; string → número entero (retorna #f si no es válido)
(define (string->int s)
  (let ([n (string->number s)])
    (if (and n (exact-integer? n)) n #f)))

;;; string → número real (retorna #f si no es válido)
(define (string->float s)
  (let ([n (string->number s)])
    (if (and n (real? n)) (exact->inexact n) #f)))

;;; número → string
(define (num->str n) (number->string n))

;;; cualquier valor → string legible
(define (val->str v) (format "~a" v))

;;; booleano → "true" / "false"
(define (bool->str b) (if b "true" "false"))

;; -----------------------------------------------------------
;; Predicados y lógica
;; -----------------------------------------------------------

;;; ¿Es un entero no negativo?
(define (nat? n) (and (exact-integer? n) (>= n 0)))

;;; ¿Está n en el rango [lo, hi]?
(define (between? n lo hi) (and (>= n lo) (<= n hi)))

;;; ¿La lista tiene exactamente n elementos?
(define (length=? lst n) (= (length lst) n))

;;; ¿La lista es no vacía?
(define (non-empty? lst) (not (null? lst)))

;; -----------------------------------------------------------
;; Matemáticas
;; -----------------------------------------------------------

;;; Limita val entre lo y hi
(define (clamp val lo hi)
  (max lo (min hi val)))

;;; Cuadrado de n
(define (square n) (* n n))

;;; Valor absoluto (alias idiomático)
(define (abs-val n) (abs n))

;;; Suma de una lista de números
(define (list-sum lst)
  (foldl + 0 lst))

;;; Producto de una lista de números
(define (list-product lst)
  (foldl * 1 lst))

;;; Promedio de una lista (error si vacía)
(define (average lst)
  (if (null? lst)
      (error "average: lista vacía")
      (/ (list-sum lst) (length lst))))

;;; ¿n es par? ¿n es impar?
(define (par? n)  (= (modulo n 2) 0))
(define (impar? n) (not (par? n)))

;; -----------------------------------------------------------
;; Listas
;; -----------------------------------------------------------

;;; Primeros n elementos de una lista
(define (take lst n)
  (if (or (null? lst) (= n 0))
      '()
      (cons (car lst) (take (cdr lst) (- n 1)))))

;;; Lista sin los primeros n elementos
(define (drop lst n)
  (if (or (null? lst) (= n 0))
      lst
      (drop (cdr lst) (- n 1))))

;;; Genera la lista (lo lo+1 ... hi-1)
(define (range lo hi)
  (if (>= lo hi)
      '()
      (cons lo (range (+ lo 1) hi))))

;;; Combina dos listas en pares: '(a b) '(1 2) → '((a 1) (b 2))
(define (zip lst1 lst2)
  (if (or (null? lst1) (null? lst2))
      '()
      (cons (list (car lst1) (car lst2))
            (zip (cdr lst1) (cdr lst2)))))

;;; Aplana un nivel de listas anidadas
(define (flatten lst)
  (cond
    [(null? lst) '()]
    [(list? (car lst)) (append (flatten (car lst)) (flatten (cdr lst)))]
    [else (cons (car lst) (flatten (cdr lst)))]))

;;; Elimina duplicados (compara con equal?)
(define (remove-duplicates lst)
  (foldl (lambda (x acc)
           (if (member x acc) acc (append acc (list x))))
         '()
         lst))

;;; Último elemento de una lista
(define (last-elem lst)
  (if (null? (cdr lst))
      (car lst)
      (last-elem (cdr lst))))

;; -----------------------------------------------------------
;; Strings
;; -----------------------------------------------------------

;;; ¿El string está vacío?
(define (string-empty? s) (= (string-length s) 0))

;;; Repite un string n veces
(define (string-repeat s n)
  (if (<= n 0)
      ""
      (string-append s (string-repeat s (- n 1)))))

;;; Une una lista de strings con un separador
(define (string-join-with lst sep)
  (if (null? lst)
      ""
      (foldl (lambda (s acc)
               (string-append acc sep s))
             (car lst)
             (cdr lst))))

;; -----------------------------------------------------------
;; Funciones de orden superior
;; -----------------------------------------------------------

;;; Composición de dos funciones: (compose2 f g)(x) = f(g(x))
(define (compose2 f g)
  (lambda (x) (f (g x))))

;;; Función identidad
(define (identity x) x)

;;; Función constante: siempre retorna v
(define (const-fn v)
  (lambda (_) v))

;;; Aplica f n veces a x: (iterate f n x) = f(f(...f(x)...))
(define (iterate f n x)
  (if (= n 0)
      x
      (iterate f (- n 1) (f x))))
`
}
