---
id: uso
icon: "🚀"
title: "Cómo usar FLP Viewer"
---

# Cómo usar FLP Viewer

FLP Viewer es un playground educativo para escribir y explorar intérpretes en Racket/EOPL.

## Flujo de trabajo

1. **Escribe tu gramática** — abre el modal *Gramática BNF* en la barra superior y define tus reglas.
2. **Genera los archivos** — el botón *Generar* crea `grammar.rkt`, `environment.rkt` y `main.rkt` con scaffolding listo.
3. **Implementa los TODOs** — en `main.rkt` completa cada caso de `eval-expression`.
4. **Ejecuta expresiones** — escribe en la consola inferior y presiona Enter.

## Paneles

| Panel | Descripción |
|---|---|
| **Editor** | Código fuente de tu intérprete (multi-archivo) |
| **AST** | Árbol de sintaxis de la última expresión evaluada |
| **Ambiente** | Cadena de frames del ambiente de ejecución |
| **Consola** | Entrada/salida y errores del intérprete |

## Atajos

- **Enter** en la consola → evalúa la expresión
- **Click en un nodo del AST** → expande/colapsa sus hijos
- **Scroll en el ambiente** → pan/zoom con la rueda del mouse
