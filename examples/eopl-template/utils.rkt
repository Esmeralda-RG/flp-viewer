#lang racket

;; Funciones utilitarias para el intérprete EOPL
;; Generado por FLP Viewer — Universidad del Valle

(provide to-decimal from-decimal convert-string operation-numerical array-slice is-number?)

;; Convierte una cadena numérica de una base dada a decimal.
(define (to-decimal num base)
  (cond
    [(eq? base 'd) num]
    [(eq? base 'b) (string->number (string-replace (to-string num) "b" "") 2)]
    [(eq? base 'o) (string->number (string-replace (to-string num) "0x" "") 8)]
    [(eq? base 'h) (string->number (string-replace (to-string num) "hx" "") 16)]))

;; Convierte un número decimal a cadena en la base dada.
(define (from-decimal num base)
  (convert-string (prefix-base base (cond
    [(eq? base 'd) (number->string num)]
    [(eq? base 'b) (number->string num 2)]
    [(eq? base 'o) (number->string num 8)]
    [(eq? base 'h) (string-upcase (number->string num 16))]))))

(define (string-contains-letters? str)
  (regexp-match? #rx"[A-Za-z]" str))

;; Convierte un token string a número o símbolo.
(define (convert-string str)
  (if (string-contains-letters? str)
      (string->symbol str)
      (string->number str)))

(define _prefix-base
  (lambda (base)
    (cond
      [(eq? base 'd) ""]
      [(eq? base 'b) "b"]
      [(eq? base 'o) "0x"]
      [(eq? base 'h) "hx"])))

(define prefix-base
  (lambda (base num)
    (if (string-contains? num "-")
      (string-append "-" (_prefix-base base) (string-replace num "-" ""))
      (string-append (_prefix-base base) num))))

(define to-string
  (lambda (x)
    (cond
      [(string? x) x]
      [(symbol? x) (symbol->string x)]
      [(number? x) (number->string x)])))

(define extract-base
  (lambda (str)
    (cond
      [(string-contains? str "b") 'b]
      [(string-contains? str "0x") 'o]
      [(string-contains? str "hx") 'h]
      [else 'd])))

;; Aplica una operación numérica respetando la base de los operandos.
(define operation-numerical
  (lambda (op num1 num2 boolean?)
    (let ([base (extract-base (to-string num1))]
          [n1   (to-decimal num1 (extract-base (to-string num1)))]
          [n2   (to-decimal num2 (extract-base (to-string num2)))])
      (if boolean?
          (op n1 n2)
          (from-decimal (op n1 n2) base)))))

;; Retorna un sub-vector de start a end (inclusivo).
(define array-slice
  (lambda (v start end)
    (let ((len (+ 1 (- end start))))
      (build-vector len (lambda (i) (vector-ref v (+ i start)))))))

;; Retorna #t si x es numérico (número o token string no decimal).
(define is-number?
  (lambda (x)
    (cond
      [(number? x) #t]
      [(string? x) (not (eq? (extract-base x) 'd))]
      [else #f])))
