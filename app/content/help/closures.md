---
id: closures
icon: "📦"
title: "Cierres (Closures)"
---

# Cierres (Closures)

Un **cierre** es una función que "recuerda" el ambiente en el que fue creada.

## El problema

```
let x = 10 in
  let f = proc(y) -(x, y) in  ; f captura x=10
    (f 3)                      ; → 7  (usa x del ambiente de creación)
```

Sin closures, `x` no estaría disponible cuando se llama `f`.

## Representación en el intérprete del curso

En el template EOPL del curso, los procedimientos se representan como **lambdas Racket** que capturan `env` y `body`:

```racket
(func-exp (lids exp)
  (lambda (args env)
    (eval-expression exp
      (extend-env lids args env))))
```

El closure es la lambda misma — Racket cierra sobre `exp` y el `env` del momento de creación.

## Llamada a un closure

```racket
(call-exp (exp args)
  (let ([func-val  (eval-expression exp env)]     ; obtiene la lambda
        [eval-args (map (lambda (a)
                          (eval-expression a env))
                        args)])                    ; evalúa argumentos
    (apply func-val (list eval-args env))))        ; llama la lambda
```

## Closures y recursión

En el lenguaje LET básico, la función **no puede llamarse a sí misma** porque `f` no está en el ambiente al momento de crear el closure.

Para recursión se necesita **letrec**:

```
letrec fact(n) =
  if zero?(n) then 1
              else *(n, (fact -(n,1)))
in (fact 5)   ; → 120
```

En `letrec`, el ambiente del closure incluye la propia definición de la función.
