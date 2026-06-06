---
id: sllgen
icon: "⚙️"
title: "SLLGEN"
order: 3
---

# SLLGEN

SLLGEN es el generador de analizadores incluido en `#lang eopl`. Convierte tu especificación léxica y tu gramática en funciones de Racket: un *scanner* (que parte el texto en tokens) y un *parser* (que arma el AST).

> 👉 **Carga el ejemplo _Lenguaje LET_** y abre el archivo `grammar.rkt` para ver lo que se describe aquí.

## Especificación léxica

Define los **tokens** que el scanner reconoce. Así está en el ejemplo:

```racket
(define lexical-spec
  '((whitespace (whitespace) skip)
    (comment ("//" (arbno (not #\newline))) skip)
    (identifier (letter (arbno (or letter digit "?"))) symbol)
    (number (digit (arbno digit)) number)))
```

| Columna | Significado |
|---|---|
| Nombre | Identificador del token (ej. `number`). |
| Patrón | Expresión regular en notación SLLGEN. |
| Tipo | `number`, `symbol`, `string` o `skip` (se descarta). |

Por eso los espacios y los comentarios `//` se ignoran: están marcados como `skip`.

## La gramática

```racket
(define grammar
  '((program (expression) a-program)
    (expression (number) lit-exp)
    (expression (identifier) var-exp)
    (expression ("-" "(" expression "," expression ")") diff-exp)
    (expression ("zero?" "(" expression ")") zero?-exp)
    (expression ("if" expression "then" expression "else" expression) if-exp)
    (expression ("let" identifier "=" expression "in" expression) let-exp)))
```

Cada regla tiene la forma `(no-terminal (componentes...) nombre-constructor)`.

## Qué genera SLLGEN

En `main.rkt`, una sola línea crea los tipos de datos del AST a partir de la gramática:

```racket
(sllgen:make-define-datatypes lexical-spec grammar)
```

Gracias a ella existen los constructores `lit-exp`, `diff-exp`, etc., y puedes recorrerlos con `cases`. El parser que transforma texto en AST se obtiene así:

```racket
(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))
```

## Patrones léxicos útiles

| Patrón | Descripción |
|---|---|
| `letter` | Letra a–z, A–Z |
| `digit` | Dígito 0–9 |
| `(arbno p)` | Cero o más repeticiones de `p` |
| `(or p1 p2)` | `p1` o `p2` |
| `(not c)` | Cualquier carácter excepto `c` |

> **Importante:** el nombre del token debe coincidir con el que usas en la gramática. Si defines `(number ...)`, en la gramática escribes `number`.
