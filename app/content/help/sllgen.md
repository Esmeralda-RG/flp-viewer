---
id: sllgen
icon: "⚙️"
title: "SLLGEN"
---

# SLLGEN

SLLGEN es el generador de parsers incluido en `#lang eopl`. Convierte tu especificación BNF en funciones Racket.

## Especificación léxica

Define los **tokens** que el scanner reconoce:

```racket
(define lexical-spec
  '(
    (whitespace (whitespace) skip)
    (comment ("//" (arbno (not #newline))) skip)
    (number (digit+) number)
    (number ("-" digit+) number)
    (identifier (letter (arbno (or letter digit "?"))) symbol)
  ))
```

| Columna | Significado |
|---|---|
| Nombre | Identificador del token (ej. `number`) |
| Patrón | Expresión regular con notación SLLGEN |
| Tipo | `number`, `symbol`, `string`, `skip` |

> **Importante:** el nombre del token debe coincidir con el que usas en la gramática. Si defines `(number ...)`, en la gramática escribes `number`.

## Especificación de gramática

```racket
(define grammar
  '(
    (program (expression) a-program)
    (expression (number) lit-exp)
    (expression (identifier) var-exp)
    (expression ("if" expression "then" expression "else" expression) if-exp)
  ))
```

Cada regla es `(lhs (items...) nombre-constructor)`.

## Funciones generadas

```racket
; Genera los datatypes de Racket
(sllgen:make-define-datatypes lexical-spec grammar)

; Parser string → AST
(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

; Parser para múltiples expresiones
(define stream-parser
  (sllgen:make-stream-parser lexical-spec grammar))
```

## Patrones léxicos SLLGEN

| Patrón | Descripción |
|---|---|
| `letter` | Letra a-z, A-Z |
| `digit` | Dígito 0-9 |
| `whitespace` | Espacio, tab, newline |
| `(arbno p)` | Cero o más `p` |
| `(or p1 p2)` | `p1` o `p2` |
| `(not c)` | Cualquier char excepto `c` |
