---
id: cargar-ejemplos
icon: "📂"
title: "Cargar ejemplos y muestras"
order: 9.5
---

# Cargar ejemplos y muestras

El botón **Ejemplos** de la barra superior abre la lista de proyectos disponibles. Cada uno trae sus cuatro archivos (`main.rkt`, `grammar.rkt`, `environment.rkt`, `utils.rkt`) y, al elegirlo, reemplaza el contenido del editor.

## Dos grupos

- **Ejemplos base** — *Hola Mundo*, *Lenguaje LET*, *Ambientes*, *Procedimientos y cierres*, *Estado y asignación*, *Procedimientos y estado* y el intérprete EOPL avanzado. Cada uno avanza un concepto a la vez y tiene su propia ayuda en este panel.
- **Muestras del curso FLP** — seis intérpretes tomados tal cual del curso Fundamentos de Lenguajes de Programación, con la sintaxis de clase (`%` para comentarios, primitivas prefijas, `let` con varias ligaduras, `proc(x, y)`). Cada una tiene su propia ayuda a continuación, con casos de prueba tomados de su `LEEME.md`.

## Cargar tu propio intérprete

No hace falta agregarlo a la lista para probarlo: pega tus propios `main.rkt`, `grammar.rkt`, `environment.rkt` y `utils.rkt` sobre los de cualquier ejemplo (pestaña por pestaña) y activa la sesión. El visor rastrea el ambiente siempre que tu código exponga `empty-env`, `extend-env`, `apply-env`, `init-env` y `eval-program` con esos nombres; si `environment.rkt` define además `apply-env-ref`, cada `set` también queda registrado en la secuencia de ambientes.
