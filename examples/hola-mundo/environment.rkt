#lang eopl

(provide (all-defined-out))

;; Ambiente vacío — este ejemplo no necesita variables
(define-datatype environment environment?
  (empty-env-record))

(define empty-env (lambda () (empty-env-record)))
(define init-env  (lambda () (empty-env)))

;; Stubs requeridos por el runner de FLP Viewer
(define _env-log '())
(define (reset-env-log!) (set! _env-log '()))
(define (env-log) _env-log)
