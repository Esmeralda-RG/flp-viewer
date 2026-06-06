---
id: ambientes
icon: "🌐"
title: "Ambientes"
order: 6
---

# Ambientes

Un **ambiente** asocia identificadores con sus valores. Es la estructura que el intérprete consulta cada vez que aparece una variable.

> 👉 **Carga el ejemplo _Ambientes_**. Usa el mismo Lenguaje LET, pero arranca con variables predefinidas para que puedas explorarlas.

## La interfaz del ambiente

```racket
(empty-env)                  ; ambiente vacío
(extend-env syms vals env)   ; agrega ligaduras nuevas
(apply-env env sym)          ; busca el valor de un símbolo
```

## El ambiente inicial

En este ejemplo, `init-env` ya define tres variables:

```racket
(define init-env
  (lambda ()
    (extend-env '(x y z) '(1 2 3) (empty-env))))
```

Por eso puedes evaluar directamente, sin declarar nada:

```
x          // → 1
-(z, x)    // → 2
```

## Cómo busca `apply-env`

Los frames forman una cadena. `apply-env` busca **de adentro hacia afuera**: revisa el frame más reciente y, si no encuentra el símbolo, sigue con el ambiente que lo contiene.

```
let x = 10 in -(x, y)
```

Aquí `x` se encuentra en el frame nuevo (`x = 10`), pero `y` no está ahí: la búsqueda continúa hasta `init-env`, donde `y = 2`. Resultado: `8`.

## Shadowing (opacamiento)

Cuando una ligadura interna usa un nombre que ya existía, **opaca** a la externa mientras dure su alcance:

```
x                       // → 1  (viene de init-env)
let x = 99 in x         // → 99 (el let opaca a x)
let x = 10 in
  let x = 20 in x       // → 20 (gana el más interno)
```

No se borra nada: al salir del `let`, el frame desaparece y `x` vuelve a valer 1.

## Qué observar

En el panel **Ambiente** verás la cadena de frames crecer con cada `let` anidado. Fíjate en que el `init-env` siempre queda en el fondo y los `let` se apilan encima.
