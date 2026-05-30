---
id: ambientes
icon: "🌐"
title: "Ambientes"
---

# Ambientes

Un **ambiente** (environment) asocia identificadores con sus valores. Es la estructura central de cualquier intérprete EOPL.

## La interfaz de ambientes

```racket
; Crea un ambiente vacío
(empty-env) → env

; Extiende el ambiente con nuevas ligaduras
(extend-env syms vals env) → env

; Busca el valor de un símbolo
(apply-env env sym) → valor
```

## Ejemplo de uso

```racket
; Ambiente con x=1, y=2
(define mi-env
  (extend-env '(x y) '(1 2) (empty-env)))

; Buscar x
(apply-env mi-env 'x)  ; → 1
(apply-env mi-env 'z)  ; → error: no binding for z
```

## Cadena de ambientes

Los ambientes forman una cadena. `apply-env` busca de adentro hacia afuera:

```racket
(define env1 (extend-env '(x) '(10) (empty-env)))
(define env2 (extend-env '(y) '(20) env1))
(define env3 (extend-env '(x) '(99) env2))  ; shadowing

(apply-env env3 'x)  ; → 99  (shadowing: toma el más interno)
(apply-env env3 'y)  ; → 20  (heredado de env2)
```

## El ambiente inicial (`init-env`)

`init-env` define los valores disponibles **desde el inicio** del intérprete. Se llama al arrancar `eval-program`:

```racket
(define init-env
  (lambda ()
    (extend-env
     '(x y z)    ; nombres
     '(1 2 3)    ; valores
     (empty-env))))

(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (exp)
        (eval-expression exp (init-env))))))  ; ← usa init-env
```

Puedes editar `init-env` desde el botón **editar init-env** en el panel de ambiente.

## Shadowing

Cuando una variable interna tiene el mismo nombre que una externa, la interna **opaca** (shadow) a la externa:

```
let x = 5 in
  let x = 10 in   ; este x opaca al anterior
    x              ; → 10
```
