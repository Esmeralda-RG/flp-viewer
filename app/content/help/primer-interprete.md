---
id: primer-interprete
icon: "🧩"
title: "Tu primer intérprete"
order: 4
---

# Tu primer intérprete

Aquí ves cómo encajan todas las piezas de un intérprete, de principio a fin, usando el Lenguaje LET.

> 👉 **Carga el ejemplo _Lenguaje LET_**. Trae tres archivos ya completos; recórrelos mientras lees.

## Los tres archivos

| Archivo | Qué contiene |
|---|---|
| `grammar.rkt` | La especificación léxica y la gramática para SLLGEN. |
| `environment.rkt` | El ambiente: `empty-env`, `extend-env`, `apply-env`. |
| `main.rkt` | `eval-program` y `eval-expression`, el corazón del intérprete. |

## El recorrido de una expresión

Escribe en la consola:

```
let x = 5 in -(x, 3)
```

Resultado: `2`. Por dentro ocurren tres pasos:

1. **Scanner + parser** (SLLGEN) convierten el texto en un AST: un `let-exp` que contiene un `lit-exp` (el 5) y un `diff-exp`.
2. **`eval-program`** arranca la evaluación con el ambiente inicial:

```racket
(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (exp)
        (eval-expression exp (init-env))))))
```

3. **`eval-expression`** recorre el AST. Para el `let`, evalúa el `5`, extiende el ambiente con `x = 5` y evalúa el cuerpo `-(x, 3)` en ese nuevo ambiente:

```racket
(let-exp (id rhs body)
  (eval-expression body
    (extend-env (list id)
                (list (eval-expression rhs env))
                env)))
```

Cuando `var-exp` busca `x`, lo encuentra ahí y devuelve `5`; la resta da `2`.

## Qué observar en los paneles

- **AST:** la estructura jerárquica de la expresión. Haz click en los nodos para confirmar que el `let` liga la variable correcta y que la resta tiene sus dos operandos.
- **Ambiente:** el frame `{x → 5}` que aparece mientras se evalúa el cuerpo del `let`.

## La idea clave

El intérprete nunca modifica un frame: cada `let` **apila** uno nuevo encima y, al terminar, ese frame desaparece. Esta misma mecánica se repite y se amplía en los ejemplos siguientes (*Ambientes*, *Procedimientos y cierres*, *Estado y asignación*).
