---
id: bnf
icon: "📐"
title: "Notación BNF"
order: 2
relatedExample: let-expresiones
---

# Notación BNF

La **Forma de Backus-Naur** (BNF) es el lenguaje con el que describes la sintaxis de tu intérprete: qué expresiones son válidas y cómo se componen.

> Para ver una gramática completa y pequeña en acción.

## Sintaxis básica

```
<regla> ::= alternativa1
          | alternativa2
          | "terminal"
```

- **`<Nombre>`** → no-terminal (referencia a otra regla).
- **`"texto"`** → terminal (un símbolo literal del lenguaje).
- **`|`** → alternativa (una u otra).

## La gramática del Lenguaje LET

Este es exactamente el lenguaje que define el ejemplo cargado:

```
<program> ::= <expression>

<expression> ::= <number>                                  => lit-exp
              | <identifier>                                => var-exp
              | "-" "(" <expression> "," <expression> ")"  => diff-exp
              | "zero?" "(" <expression> ")"               => zero?-exp
              | "if" <expression> "then" <expression>
                  "else" <expression>                      => if-exp
              | "let" <identifier> "=" <expression>
                  "in" <expression>                        => let-exp
```

Con él puedes evaluar, por ejemplo:

```
let x = 5 in -(x, 3)        // → 2
```

## El nombre tras `=>`

El nombre después de `=>` es el **constructor** del nodo del AST. Cada alternativa de la gramática se vuelve un tipo de nodo, y por eso en `main.rkt` puedes escribir:

```racket
(cases expression exp
  (lit-exp (n) n)
  (var-exp (id) (apply-env env id))
  (diff-exp (e1 e2) ...))
```

Hay una correspondencia directa: **una regla en la gramática ↔ un caso en `eval-expression`**.

## Por qué solo hay resta

El Lenguaje LET no incluye suma a propósito: con `diff-exp` (resta) y `zero?` alcanza para construir cualquier otra operación, manteniendo la gramática mínima. Un número negativo, por ejemplo, se obtiene con `-(0, 5)`.

## Restricción LL(1)

SLLGEN usa análisis LL(1): dos alternativas de la **misma regla** no pueden empezar con el mismo token. En el Lenguaje LET cada alternativa arranca con algo distinto (`-`, `zero?`, `if`, `let`, un número o un identificador), por eso no hay conflicto.
