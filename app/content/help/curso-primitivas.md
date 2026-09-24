---
id: curso-primitivas
icon: "🔢"
title: "Curso: intérprete simple con primitivas"
order: 10
relatedExample: curso-primitivas
---

# Curso: intérprete simple con primitivas

El primer intérprete del curso FLP (Corte 1, tema 3). El lenguaje solo tiene literales numéricos, identificadores y primitivas prefijas `+`, `-`, `*`, `/`, `add1` y `sub1`, con los argumentos entre paréntesis separados por coma. No hay `let` ni ligaduras locales: el ambiente es siempre el mismo, `init-env`, en un solo marco.

> Usa la sintaxis del curso: comentarios con `%` y primitivas prefijas como `+(x, y)`.

## El ambiente inicial

```racket
(define init-env
  (lambda ()
    (extend-env '(x y z a b c) '(1 2 3 4 5 6) (empty-env))))
```

Como no hay `let`, cada programa evalúa sobre este mismo marco; lo que cambia de uno a otro es el árbol y el valor.

## Pruébalo

```
+(a, *(b, sub1(c)))   // → 29, anidamiento de primitivas y variables
-(c, a, b)            // → -3, resta n-aria del curso: -(c,a,b) = c - (a + b)
+(x, w)               // → error: w no está en init-env
```

## Qué observar

Como el lenguaje no crea marcos, el panel **Ambiente** se queda en `empty-env` → `init-env` durante toda la ejecución; lo que varía es de dónde sale cada valor dentro de ese único marco.
