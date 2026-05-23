export function generateEnvironmentRkt(): string {
  return `#lang eopl

(provide (all-defined-out))

;;; ============================================================
;;; environment.rkt — Utilidades generadas por FLP Viewer
;;; Universidad del Valle — Intérprete Educativo
;;; ============================================================

;; ---------------------------------------------------------------------------
;; Datatypes
;; ---------------------------------------------------------------------------

(define-datatype environment environment?
  (empty-env-record)
  (extended-env-record
    (syms  (list-of symbol?))
    (refs  vector?)
    (env   environment?)))

(define-datatype reference reference?
  (a-ref (pos integer?) (vec vector?)))

;; ---------------------------------------------------------------------------
;; Ambiente
;; ---------------------------------------------------------------------------

(define empty-env
  (lambda ()
    (empty-env-record)))

(define extend-env
  (lambda (syms vals env)
    (extended-env-record
      syms
      (list->vector (map newref vals))
      env)))

(define extend-env*
  (lambda (syms vals env)
    (if (null? syms)
        env
        (extend-env syms vals env))))

(define apply-env
  (lambda (env sym)
    (deref (apply-env-ref env sym))))

(define apply-env-ref
  (lambda (env sym)
    (cases environment env
      (empty-env-record ()
        (eopl:error 'apply-env "Variable no ligada: ~s" sym))
      (extended-env-record (syms refs saved-env)
        (let loop ((i 0) (ss syms))
          (cond
            ((null? ss)
             (apply-env-ref saved-env sym))
            ((eqv? sym (car ss))
             (a-ref i refs))
            (else
             (loop (+ i 1) (cdr ss)))))))))

;; ---------------------------------------------------------------------------
;; Store (referencias mutables)
;; ---------------------------------------------------------------------------

(define the-store 'uninitialized)

(define empty-store
  (lambda ()
    (set! the-store '())))

(define initialize-store!
  (lambda ()
    (empty-store)))

(define newref
  (lambda (val)
    (let ((next-ref (length the-store)))
      (set! the-store (append the-store (list val)))
      next-ref)))

(define deref
  (lambda (ref)
    (cases reference ref
      (a-ref (pos vec)
        (vector-ref vec pos)))))

(define setref!
  (lambda (ref val)
    (cases reference ref
      (a-ref (pos vec)
        (vector-set! vec pos val)))))

;; ---------------------------------------------------------------------------
;; Ambiente inicial
;; ---------------------------------------------------------------------------

(define init-env
  (lambda ()
    (initialize-store!)
    (extend-env
      '(true false emptylist)
      (list #t #f '())
      (empty-env))))

;; ──── FLP-VIEWER-TRACKING-START ────────────────────────────────────
;; Tracking de ambientes para FLP Viewer (eliminado al descargar)
(define _env-log '())
(define (reset-env-log!) (set! _env-log '()))
(define (env-log) _env-log)
(define (_env->frames e)
  (cases environment e
    (empty-env-record () '())
    (extended-env-record (syms refs inner-env)
      (cons (map cons syms (vector->list refs))
            (_env->frames inner-env)))))
(define _orig-extend-env extend-env)
(set! extend-env
  (lambda (syms vals env)
    (let ([new-env (_orig-extend-env syms vals env)])
      (set! _env-log (cons (list 'extend (_env->frames new-env)) _env-log))
      new-env)))
;; ──── FLP-VIEWER-TRACKING-END ──────────────────────────────────────
`
}
