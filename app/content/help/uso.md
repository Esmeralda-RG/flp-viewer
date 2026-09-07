---
id: uso
icon: "🚀"
title: "Cómo usar FLP Viewer"
order: 1
relatedExample: hola-mundo
---

# Cómo usar FLP Viewer

FLP Viewer es un playground para escribir y explorar intérpretes en Racket/EOPL. Cada concepto del curso tiene un **ejemplo** (código mínimo ejecutable) y una **ayuda** (esta guía) que lo explica.

> Desde la biblioteca para dar tus primeros pasos.

## Los cuatro paneles

| Panel | Para qué sirve |
|---|---|
| **Editor** | El código del intérprete (varios archivos `.rkt`). |
| **AST** | El árbol de la última expresión que evaluaste. |
| **Ambiente** | La cadena de frames con las variables vigentes. |
| **Consola** | Donde escribes expresiones y ves el resultado. |

## Tu primera ejecución

El ejemplo *Hola Mundo* es el intérprete más pequeño posible: solo entiende texto entre comillas y la palabra `print`. Escribe en la consola y presiona Enter:

```
"hola mundo"
```

Resultado: `hola mundo`. En el panel **AST** verás cómo ese texto se convirtió en un nodo `string-exp`.

## Cómo funciona

Todo intérprete en FLP Viewer hace dos cosas:

1. **Parsear** — `grammar.rkt` describe la sintaxis; SLLGEN convierte el texto en un AST.
2. **Evaluar** — `eval-expression` (en `main.rkt`) recorre ese AST y produce un valor.

En *Hola Mundo*, `eval-expression` solo arma una cadena a partir de las palabras. Los demás ejemplos van agregando piezas (variables, condicionales, ambientes, estado) sobre esta misma idea.

## Atajos

- **Enter** en la consola → evalúa la expresión.
- **Click en un nodo del AST** → expande o colapsa sus hijos.
- **Rueda del mouse sobre el ambiente** → desplazar y hacer zoom.

## Cómo seguir

Avanza por los ejemplos en orden: cada uno añade un concepto y tiene su propia ayuda. El siguiente es **Lenguaje LET**.
