---
id: evaluacion
icon: "▶️"
title: "Evaluación"
---

# Evaluación

El intérprete transforma un **AST** en un **valor** recorriendo el árbol recursivamente.

## eval-program

Punto de entrada. Extrae la expresión principal y la evalúa con `init-env`:

```racket
(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (exp)
        (eval-expression exp (init-env))))))
```

## eval-expression

Despacha según el tipo de nodo del AST. Cada caso corresponde a una producción de la gramática:

```racket
(define eval-expression
  (lambda (exp env)
    (cases expression exp

      ; Literal numérico → devuelve el número directamente
      (lit-exp (n) n)

      ; Variable → busca en el ambiente
      (var-exp (id)
        (apply-env env id))

      ; Diferencia → evalúa ambos lados y resta
      (diff-exp (exp1 exp2)
        (- (eval-expression exp1 env)
           (eval-expression exp2 env)))

      ; Condicional → evalúa condición, luego rama correspondiente
      (if-exp (test-exp true-exp false-exp)
        (if (eval-expression test-exp env)
            (eval-expression true-exp env)
            (eval-expression false-exp env)))

      ; Ligadura local → extiende el ambiente con el nuevo binding
      (let-exp (id rhs-exp body-exp)
        (let ([val (eval-expression rhs-exp env)])
          (eval-expression body-exp
            (extend-env (list id) (list val) env))))

      )))
```

## Patrón general

Cada caso sigue el mismo patrón:

1. **Extraer** los campos del nodo (`id`, `exp1`, `exp2`, etc.)
2. **Evaluar** sub-expresiones recursivamente con `(eval-expression sub env)`
3. **Combinar** los resultados y devolver el valor final

## Error de TODO

Si ejecutas una expresión antes de implementar su caso, verás:

```
✕ TODO: implement lit-exp
```

Esto indica qué caso falta. Busca ese `(error "TODO: implement lit-exp")` en `main.rkt` y reemplázalo con la implementación.
