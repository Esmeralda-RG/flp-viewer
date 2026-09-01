---
id: estado
icon: "🔄"
title: "Estado y asignación"
order: 8
relatedExample: estado
---

# Estado y asignación

Hasta ahora una variable conservaba el valor que se le ligó. Un lenguaje con **estado** permite además **cambiar** ese valor más adelante. Aquí aparece una distinción que suele confundirse: **ligadura** vs. **asignación**.

> Agrega `set` y `begin` sobre el Lenguaje LET, y guarda los valores en celdas mutables (referencias).

## Ligadura (binding)

Una **ligadura** crea una asociación nombre → celda *nueva* en el ambiente. La produce `let` (y los parámetros de un procedimiento). Si el nombre ya existía, la ligadura interna lo **opaca** (*shadowing*), pero la externa queda intacta.

```
let x = 5 in
  let x = 10 in   // nueva ligadura, opaca a la anterior
    x             // → 10
```

## Asignación (assignment)

Una **asignación** (`set`) **no** crea una variable nueva: escribe sobre la **celda** de una ligadura que ya existe.

```
let x = 5 in
  begin
    set x = 10 ;   // modifica la celda de x
    x              // → 10
  end
```

La diferencia clave: `let` **crea** la celda; `set` **sobrescribe** una celda existente. Por eso `set` sobre un nombre no ligado produce un error de "no hay ligadura".

## Secuenciación con `begin`

La asignación solo es útil si se pueden ejecutar varias instrucciones en orden. `begin ... end` evalúa una secuencia de expresiones separadas por `;` y devuelve el valor de la última:

```
let x = 0 in
  begin
    set x = 5 ;
    set x = -(x, 2) ;
    x                  // → 3
  end
```

## Observa el ambiente

En el panel **Ambiente** verás que `set` **no apila un frame nuevo**: reutiliza la celda de la ligadura existente y cambia su valor. Esa es la diferencia visual entre **ligar** (lo que hace `let`, que agrega un frame) y **asignar** (lo que hace `set`, que escribe sobre una celda ya creada).
