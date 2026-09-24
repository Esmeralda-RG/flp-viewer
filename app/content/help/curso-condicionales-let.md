---
id: curso-condicionales-let
icon: "🔀"
title: "Curso: condicionales y let"
order: 11
relatedExample: curso-condicionales-let
---

# Curso: condicionales y let

El intérprete del tema 4 (Corte 1) agrega booleanos, las comparaciones `>`, `>=`, `<`, `<=`, `==`, el condicional `if-then-else` y el `let` con cualquier número de ligaduras.

> Dos reglas del curso se ven directamente en el panel de ambientes.

## Regla 1: el `let` no ve sus propias ligaduras

Las expresiones a la derecha de un `let` con varias ligaduras se evalúan **todas en el ambiente de afuera**, y solo después se crea un único marco con todas ellas:

```
let x = 10 y = +(x,1) in +(x,y)   // → 15, no 21
```

`+(x,1)` usa la `x` del ambiente inicial (`x = 4`), no la `x = 10` del mismo `let`.

## Regla 2: el `if` solo evalúa una rama

La condición debe ser booleana, y el marco de un `let` que está en la rama descartada **nunca llega a crearse**:

```
let a = 8 in let k = if >(a,10) then let j = 9 in +(j,8) else 4 in +(k,8)
// → 12; el marco {j: 9} no aparece porque >(8,10) es falso
```

## Errores típicos

```
let p = 3 q = p in q       // → error: p no existe cuando se evalúa q
if +(x,1) then 1 else 0    // → error: el test-exp debe ser booleano
```

## Qué observar

Compara la secuencia de marcos entre la rama `then` y la rama `else` del mismo programa: solo la rama que corrió deja rastro en el panel **Ambiente**.
