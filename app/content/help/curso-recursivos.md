---
id: curso-recursivos
icon: "🔁"
title: "Curso: procedimientos recursivos con letrec"
order: 13
relatedExample: curso-recursivos
---

# Curso: procedimientos recursivos con letrec

Con `let` y `proc` no se puede escribir un procedimiento recursivo: cuando se crea la clausura, su propio nombre todavía no está en el ambiente que capturó. `letrec` lo resuelve creando primero el marco con los nombres, de modo que cada procedimiento se cree ya viendo ese marco (el suyo y el de los demás, para recursión mutua).

> En el panel, el marco del `letrec` liga cada nombre a `<proc-recursivo>`; debajo aparece un marco nuevo por cada llamada.

## Por qué hace falta `letrec`

```
let fact = proc(n) if ==(n,0) then 1 else *(n, (fact sub1(n))) in (fact 3)
// → error: fact no se encuentra
```

La clausura capturó el ambiente **anterior** al `let`, donde `fact` todavía no existe.

## Recursión

```
letrec fact(n) = if ==(n,0) then 1 else *(n, (fact sub1(n))) in (fact 5)   // → 120
```

Cada llamada abre un marco nuevo (`{n: 5}`, `{n: 4}`, …) que extiende **el mismo marco** del `letrec`, no la llamada anterior.

## Recursión mutua

```
letrec par?(n)   = if ==(n,0) then true  else (impar? sub1(n))
       impar?(n) = if ==(n,0) then false else (par? sub1(n))
in (impar? 7)   // → true
```

Un solo marco `{par?: <proc-recursivo>, impar?: <proc-recursivo>}` ata a ambos procedimientos entre sí.

## Qué observar

Con una función como `fact`, todos los marcos de llamada apuntan al mismo padre en el panel: la flecha "extiende" no encadena una llamada con la siguiente, sino cada llamada con el ambiente donde `letrec` creó el procedimiento.
