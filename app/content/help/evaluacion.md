---
id: evaluacion
icon: "▶️"
title: "Evaluación"
order: 5
---

# Evaluación

Evaluar es transformar un **AST** en un **valor**, recorriendo el árbol de forma recursiva.

> 👉 **Carga el ejemplo _Lenguaje LET_** y abre `main.rkt`: aquí explicamos su `eval-expression` caso por caso.

## eval-expression

`eval-expression` recibe una expresión y un ambiente, y despacha según el tipo de nodo. Cada caso corresponde a una regla de la gramática:

```racket
(define eval-expression
  (lambda (exp env)
    (cases expression exp

      (lit-exp (n) n)

      (var-exp (id) (apply-env env id))

      (diff-exp (e1 e2)
        (- (eval-expression e1 env)
           (eval-expression e2 env)))

      (zero?-exp (e)
        (if (zero? (eval-expression e env)) #t #f))

      (if-exp (test t f)
        (if (eval-expression test env)
            (eval-expression t env)
            (eval-expression f env)))

      (let-exp (id rhs body)
        (eval-expression body
          (extend-env (list id)
                      (list (eval-expression rhs env))
                      env))))))
```

## El patrón común

Casi todos los casos siguen tres pasos:

1. **Extraer** los campos del nodo (`e1`, `e2`, `id`…).
2. **Evaluar** las sub-expresiones recursivamente con `(eval-expression sub env)`.
3. **Combinar** los resultados y devolver el valor.

Dónde difieren:

- `lit-exp` es el **caso base**: no recurre, devuelve el número tal cual.
- `var-exp` consulta el **ambiente** en vez de recurrir.
- `let-exp` es el único que **cambia el ambiente**: lo extiende antes de evaluar el cuerpo.

## Pruébalo

```
zero?(0)                         // → #t
if zero?(0) then 42 else 99      // → 42
let x = 10 in let y = 3 in -(x, y)  // → 7
```

Observa en el panel **AST** cómo cada expresión corresponde a la estructura de nodos, y en **Ambiente** cómo los `let` anidados apilan un frame por cada ligadura.
