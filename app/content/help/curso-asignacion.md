---
id: curso-asignacion
icon: "📝"
title: "Curso: asignación y referencias"
order: 14
relatedExample: curso-asignacion
---

# Curso: asignación y referencias

Sigue el modelo IMPLICIT-REFS de EOPL: el ambiente liga cada identificador con una **referencia** (una celda), no con un valor directo. `let`, la aplicación de un procedimiento y `letrec` crean marcos nuevos; `set x = e` no crea ningún marco, solo busca la celda de `x` y escribe en ella.

> En el panel, cada marco nuevo se rotula `extend` y cada escritura en una celda se rotula `asignación`, por separado.

## Ligadura frente a asignación

```
let x = 1 in begin let x = 10 in x ; set x = 7 ; x end   // → 7
```

El `let` interno abre un marco con su propia `x`; el `set` de después escribe en la `x` externa (la visible al terminar ese `let`), no en la que ya desapareció.

## `set` sobre una celda capturada por un cierre

```
let x = 100 in
  let p = proc(a) begin set x = add1(x); a end
  in +((p x), (p x))   // → 201
```

`p` captura la **celda** de `x`, no su valor: la segunda llamada ve el `set` que dejó la primera (100 + 101).

## Contador con estado compartido

```
let c = 0 in
  let inc = proc() begin set c = add1(c) ; c end
  in begin (inc) ; (inc) ; (inc) end   // → 3
```

## Qué observar

Sigue la secuencia `extend` / `asignación` en el panel: un `set` nunca agrega un marco, solo dispara una entrada `asignación` sobre el marco donde vive esa celda.
