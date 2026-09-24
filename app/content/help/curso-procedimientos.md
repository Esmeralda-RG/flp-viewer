---
id: curso-procedimientos
icon: "🧵"
title: "Curso: procedimientos y cierres"
order: 12
relatedExample: curso-procedimientos
---

# Curso: procedimientos y cierres

Agrega procedimientos de primera clase al intérprete de condicionales y `let`. `proc(x, y) cuerpo` crea una clausura con sus parámetros, su cuerpo y el ambiente donde se evaluó; `(f a b)` la aplica, verificando antes que `f` sea un procedimiento y que la aridad coincida.

> El cuerpo de la clausura se evalúa en un marco que extiende el ambiente **de su creación**, no el de la llamada: es alcance estático.

## Alcance estático

```
let x = 10 in let f = proc(y) +(x, y) in let x = 20 in (f 5)   // → 15
```

`f` resuelve `x` donde fue creada (`x = 10`), no en la `x = 20` que está a la vista cuando se llama. Con alcance dinámico habría dado `25`.

## Procedimiento que devuelve un procedimiento

```
let sumar = proc(x) proc(y) +(x, y) in
  let sumar3 = (sumar 3) in (sumar3 4)   // → 7
```

`sumar3` sigue recordando `x = 3` aunque ese marco ya no esté en la cadena visible del `let`; eso es lo que hace un cierre.

## Errores típicos

```
let f = proc(x, y) +(x, y) in (f 1)
// → error: se esperaban 2 argumentos y llegó 1
```

## Qué observar

En el panel, una clausura se muestra como `<closure>`. Fíjate en que el marco de los parámetros de cada llamada extiende el marco donde la clausura se creó, no el marco desde el que se llamó.
