---
id: ejemplos
icon: "🧪"
title: "Explorar el intérprete avanzado"
order: 9
---

# Intérprete EOPL (avanzado)

Una vez recorridos los ejemplos mínimos, este es un intérprete **completo** para experimentar libremente. No usa la sintaxis tradicional de EOPL, sino una propia más cercana a un lenguaje real.

> 👉 **Carga el ejemplo _Intérprete EOPL (avanzado)_**. Es un proyecto extenso: úsalo como referencia, no para aprender un concepto puntual.

## Qué incorpora

A diferencia de los ejemplos mínimos, aquí encontrarás de todo: operaciones primitivas, condicionales con llaves, funciones, estado, estructuras, arreglos, listas y reconocimiento de patrones.

## Expresiones básicas

```scheme
; Variables del init-env (x=1, y=2, z=3)
x

; Operación primitiva
(5 + 3)

; Condicional
if (x > 0) { x else (0 - x) }
```

## Ligadura y funciones

```scheme
; Ligadura inmutable
let a = 5 in (a + 1)

; Variable mutable
var c = 0 in begin set c = (c + 1) ; c end

; Función y llamada
let doble = func(n) (n + n) in call doble(7)
```

## Recursión con funciones

```scheme
var f = func(n) if (n == 0) { 0 else (n + call f((n - 1))) }
  in call f(10)
```

## Verificar el ambiente

Al evaluar una llamada recursiva, el panel **Ambiente** muestra cómo se apila un frame por cada invocación, cada uno con su propio valor del parámetro.

## Depurar con el AST

El panel **AST** muestra la estructura del programa. Úsalo para confirmar:

- ¿El parser interpretó la expresión como esperabas?
- ¿Los operadores recibieron los operandos correctos?
- ¿El `let` o el `var` ligan la variable que querías?

Haz click en los nodos para explorar el árbol.
