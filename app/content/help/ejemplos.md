---
id: ejemplos
icon: "💡"
title: "Ejemplos"
---

# Ejemplos

## Lenguaje LET — expresiones básicas

Con el ejemplo **Lenguaje LET** cargado:

```scheme
; Literal
5

; Diferencia
-(10, 3)

; ¿Es cero?
zero?(0)

; Condicional
if zero?(0) then 42 else 99

; Ligadura local
let x = 5 in -(x, 1)

; Anidado
let x = 10 in
  let y = 3  in
    -(x, y)
```

## Funciones y llamadas

```scheme
; Crear y llamar una función
(proc(x) -(x, 1) 10)

; Con let
let f = proc(x) -(x, 1) in
  (f 5)

; Función de dos usos
let double = proc(x) -(0, -(0, -(x, -(0,x)))) in
  (double 7)
```

## Intérprete del curso (template EOPL)

```scheme
; Variable del init-env
x

; Declaración var
var f = func(x) if (x == 0) { 0 else (x + call f((x - 1))) }
        in call f(10)

; Operación primitiva
(5 + 3)

; Condicional
if (x > 0) { x else (0 - x) }
```

## Verificar el ambiente

Al evaluar `var f = func(x) ... in call f(4)`, el panel de ambiente mostrará:

```
empty-env → init-env {x,y,z} → extend {f} → extend {x=4} → extend {x=3} → ...
```

Cada llamada recursiva agrega un frame con el nuevo valor de `x`.

## Depuración con el AST

El panel AST muestra la estructura del programa. Úsalo para verificar:

- ¿El parser interpretó la expresión como esperabas?
- ¿Los operadores tienen los operandos correctos?
- ¿El `let` liga la variable que quieres?

Haz click en los nodos para explorar el árbol.
