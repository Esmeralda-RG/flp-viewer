---
id: bnf
icon: "📐"
title: "Notación BNF"
---

# Notación BNF

La **Forma de Backus-Naur** (BNF) es el lenguaje con el que describes la sintaxis de tu intérprete.

## Sintaxis básica

```
<regla> ::= alternativa1
          | alternativa2
          | "terminal"
```

- **`<Nombre>`** → no-terminal (referencia a otra regla)
- **`"texto"`** → terminal (token literal)
- **`|`** → alternativa (OR)

## Cuantificadores

| Sintaxis | Significado |
|---|---|
| `<X>*` | Cero o más |
| `<X>+` | Uno o más |
| `[<X>]` | Opcional (cero o uno) |

## Ejemplo: lenguaje LET

```
<program> ::= <expr>

<expr> ::= <number>                               => lit-exp
         | <identifier>                           => var-exp
         | "-" "(" <expr> "," <expr> ")"          => diff-exp
         | "zero?" "(" <expr> ")"                 => zero?-exp
         | "if" <expr> "then" <expr> "else" <expr> => if-exp
         | "let" <identifier> "=" <expr>
             "in" <expr>                          => let-exp
         | "proc" "(" <identifier> ")" <expr>     => proc-exp
         | "(" <expr> <expr> ")"                  => call-exp
```

## Nombre de variante (`=> nombre`)

El nombre después de `=>` es el **constructor** que SLLGEN genera. Lo usarás en `cases` dentro de Racket:

```racket
(cases expression exp
  (lit-exp (n) n)
  (var-exp (id) (apply-env env id))
  ...)
```

## Restricción LL(1)

SLLGEN usa parsing LL(1): dos alternativas de la **misma regla** no pueden comenzar con el mismo token.

**Conflicto** ❌
```
<expr> ::= "(" <expr> "+" <expr> ")"   ; ambas empiezan con "("
         | "(" <expr> <expr> ")"
```

**Sin conflicto** ✅
```
<expr> ::= "-" "(" <expr> "," <expr> ")"   ; empieza con "-"
         | "(" <expr> <expr> ")"            ; empieza con "("
```
