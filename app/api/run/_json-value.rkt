#lang racket
(provide json-value)

;; Convierte un valor de Racket (incluyendo structs de define-datatype del
;; estudiante) a algo que write-json pueda serializar. Vive en su propio
;; módulo para que _tracking.rkt pueda convertir clausuras/celdas al momento
;; de registrarlas (ver _tracking.rkt), no solo al final del paso — así el
;; panel muestra el estado que tenían cuando se crearon, no el que quedó tras
;; asignaciones posteriores en el mismo paso.

; Los intérpretes con letrec/asignación pueden construir un ciclo real
; struct-vector-struct (una clausura que se guarda a sí misma en el ambiente
; que capturó). seen rastrea, por identidad, qué structs siguen abiertos en
; la rama actual de la recursión para cortar el ciclo en vez de agotar la pila.
(define (json-value v [seen (make-hasheq)])
  (cond
    [(or (null? v) (boolean? v) (number? v) (string? v)) (json-number v)]
    [(symbol? v) (symbol->string v)]
    [(pair? v) (map (lambda (x) (json-value x seen)) v)]
    [(vector? v) (map (lambda (x) (json-value x seen)) (vector->list v))]
    [(struct? v)
     (if (hash-ref seen v #f)
         (hasheq 'type "ciclo" 'fields '())
         (let* ([data     (struct->vector v)]
                [raw-type (symbol->string (vector-ref data 0))]
                [type     (regexp-replace #rx"^struct:" raw-type "")])
           (hash-set! seen v #t)
           (let ([fields (for/list ([i (in-range 1 (vector-length data))])
                           (json-value (vector-ref data i) seen))])
             (hash-remove! seen v)
             (hasheq 'type type 'fields fields))))]
    [(procedure? v) (hasheq 'type "procedure")]
    [else (format "~a" v)]))

; write-json exige jsexpr?: enteros exactos o reales inexactos, no racionales
; exactos no enteros. /(1, 2) da 1/2 y tumbaba write-json para toda la corrida.
(define (json-number v)
  (if (and (rational? v) (exact? v) (not (integer? v)))
      (exact->inexact v)
      v))
