---
id: primer-interprete
icon: "⚙️"
title: "Tu primer intérprete"
---

# Tu primer intérprete

Este es el flujo completo para construir un intérprete desde una gramática hasta ver resultados.

## 1. Escribe la gramática

Abre el modal **Gramática BNF** en la barra superior.

En la sección de **tokens** escribe los terminales que necesita tu lenguaje:

```
number
identifier
```

En la sección de **gramática** define las reglas. Por ejemplo, el lenguaje LET del libro EOPL:

```
<program> ::= <expr>

<expr> ::= <number>                                  => lit-exp
         | <identifier>                              => var-exp
         | "-" "(" <expr> "," <expr> ")"             => diff-exp
         | "zero?" "(" <expr> ")"                    => zero?-exp
         | "if" <expr> "then" <expr> "else" <expr>   => if-exp
         | "let" <identifier> "=" <expr> "in" <expr> => let-exp
```

El nombre después de `=>` es el **constructor** que SLLGEN generará. Lo usarás dentro de `cases` en Racket.

## 2. Genera los archivos

Haz clic en **Generar**. FLP Viewer produce tres archivos automáticamente:

| Archivo | Contenido |
|---|---|
| `grammar.rkt` | `lexical-spec` y `grammar` listos para SLLGEN |
| `environment.rkt` | Ambiente con `extend-env`, `apply-env`, `init-env` |
| `main.rkt` | Esqueleto de `eval-program` y `eval-expression` con un `TODO` por cada variante |

No tienes que tocar `grammar.rkt` ni `environment.rkt`. Solo trabajas en `main.rkt`.

## 3. Implementa los TODOs

En `main.rkt` verás algo como esto:

```racket
(define eval-expression
  (lambda (exp env)
    (cases expr exp

      (lit-exp (n)
        ;; TODO: implementar lit-exp
        (error "TODO: implementar lit-exp"))

      (var-exp (id)
        ;; TODO: implementar var-exp
        (error "TODO: implementar var-exp"))

      ...
    )))
```

Reemplaza cada `(error ...)` con la lógica del caso. Para el lenguaje LET:

```racket
(lit-exp (n)
  n)

(var-exp (id)
  (apply-env env id))

(diff-exp (expr expr2)
  (- (eval-expression expr env)
     (eval-expression expr2 env)))

(zero?-exp (expr)
  (zero? (eval-expression expr env)))

(if-exp (expr expr2 expr3)
  (if (eval-expression expr env)
      (eval-expression expr2 env)
      (eval-expression expr3 env)))

(let-exp (id expr expr2)
  (eval-expression expr2
    (extend-env (list id)
                (list (eval-expression expr env))
                env)))
```

## 4. Ejecuta

Escribe una expresión en la consola y presiona Enter:

```
let x = 5 in -(x, 3)
```

Resultado: `2`. El panel AST mostrará la estructura del programa y el panel Ambiente mostrará los frames generados durante la evaluación.

---

## Por qué funciona

El intérprete tiene dos responsabilidades: **parsear** y **evaluar**.

`grammar.rkt` le dice a SLLGEN cómo convertir texto en un árbol. Cada producción de la gramática se vuelve un constructor de datos — por eso puedes hacer `(cases expr exp ...)` en Racket: SLLGEN ya definió los tipos por ti.

`eval-expression` recorre ese árbol recursivamente. El segundo argumento, `env`, es el **ambiente**: una cadena de frames que asocia nombres a valores. Cuando evalúas `let x = 5 in -(x, 3)`, pasan tres cosas en orden:

1. Se evalúa `5` → resultado `5`
2. Se crea un nuevo frame `{x → 5}` encadenado al ambiente actual
3. Se evalúa `-(x, 3)` en ese ambiente extendido — cuando `var-exp` busca `x`, lo encuentra ahí

Por eso el panel Ambiente muestra una cadena de frames: cada `let` anidado agrega uno. La evaluación nunca modifica un frame existente — solo apila uno nuevo encima. Eso garantiza que cuando el `let` termina, el frame desaparece y el ambiente vuelve a ser el anterior.
