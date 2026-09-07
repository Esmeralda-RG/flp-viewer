---
id: closures
icon: "📦"
title: "Cierres (Closures)"
order: 7
relatedExample: cierres
---

# Cierres (Closures)

Un **cierre** es un procedimiento que "recuerda" el ambiente en el que fue creado. Es lo que permite que una función use variables que estaban a la vista cuando se definió.

> Agrega `proc` y `call` sobre el Lenguaje LET.

## Crear y llamar un procedimiento

```
let f = proc (x) -(x, 1) in (f 5)     // → 4
```

- `proc (x) -(x, 1)` crea un procedimiento de un parámetro.
- `(f 5)` lo llama con el argumento `5`.

## Por qué es un cierre

Mira el caso `proc-exp` en `main.rkt`:

```racket
(proc-exp (param body)
  (lambda (arg)
    (eval-expression body
      (extend-env (list param) (list arg) env))))
```

El procedimiento se representa como una **función de Racket** que captura `body` y, sobre todo, el `env` del momento en que se creó. Por eso recuerda su ambiente: ese `env` queda "encerrado" dentro de la lambda.

La llamada simplemente evalúa el operador y el argumento, y aplica el procedimiento:

```racket
(call-exp (rator rand)
  (let ([proc (eval-expression rator env)]
        [arg  (eval-expression rand env)])
    (proc arg)))
```

## El cierre en acción

```
let x = 10 in
  let f = proc (y) -(x, y) in
    (f 3)                            // → 7
```

Cuando se crea `f`, captura el ambiente donde `x = 10`. Al llamar `(f 3)`, evalúa `-(x, y)` con `y = 3` y el `x = 10` que recordaba. Sin cierres, `x` no estaría disponible en ese momento.

## Sobre la recursión

En este lenguaje un procedimiento **no puede llamarse a sí mismo**, porque su nombre todavía no está ligado en el ambiente que captura. La recursión requiere `letrec`, que está disponible en el ejemplo **Intérprete EOPL (avanzado)**.
