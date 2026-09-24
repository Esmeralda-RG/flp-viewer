---
id: curso-paso-por-referencia
icon: "🔗"
title: "Curso: paso por referencia"
order: 15
relatedExample: curso-paso-por-referencia
---

# Curso: paso por referencia

Sigue la sección 4.3 de EOPL sobre el intérprete de asignación. Cada celda del ambiente guarda un *target*: `direct-target` si tiene valor propio, `indirect-target` si apunta a la celda de otra variable. Cuando el operando de una llamada es una variable, el parámetro recibe un `indirect-target` hacia esa celda; cualquier otra expresión se evalúa y llega como `direct-target` (paso por valor).

> En el panel, las ligaduras de este intérprete se muestran por su tipo de target: `d` (directo) o `i` (indirecto).

## Paso por referencia frente a paso por valor

```
let a = 10 b = 20 in
  let swap = proc(x, y) let t = x in begin set x = y; set y = t end
  in begin (swap a b); [a, b] end       // → [20, 10]  (x, y son alias de a, b)

let a = 10 b = 20 in
  let swap = proc(x, y) let t = x in begin set x = y; set y = t end
  in begin (swap +(a,0) +(b,0)); [a, b] end   // → [10, 20]  (copias: swap no toca a, b)
```

La única diferencia entre los dos programas es si el operando es la variable misma o una expresión sobre ella.

## Dos parámetros, una sola celda

```
let a = 3 in
  let p = proc(u, w) begin set u = 10; set w = +(w, 1); [u, w, a] end
  in (p a a)   // → [11, 11, 11]
```

`u`, `w` y `a` terminan siendo la misma celda: por eso `w` ya vale `10` cuando se le suma `1`.

## Qué observar

Un `set` sobre un parámetro indirecto deja **dos** asignaciones seguidas en el panel: primero la celda de la variable del llamador, después la del parámetro que apunta a ella.
