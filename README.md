# FLP Viewer

Playground educativo para el curso de **Fundamentos de Lenguajes de Programación** de la Universidad del Valle. Permite a los estudiantes escribir intérpretes en Racket/EOPL, visualizar el AST generado y explorar la evolución del ambiente de ejecución en tiempo real.

> Proyecto de tesis de grado — Ingeniería de Sistemas, Universidad del Valle.

---

## ¿Qué hace?

FLP Viewer actúa como entorno de desarrollo integrado orientado a la pedagogía de intérpretes:

- **Editor multi-archivo** con Monaco Editor: `main.rkt`, `grammar.rkt`, `environment.rkt`, `utils.rkt`, con líneas bloqueadas para el scaffolding generado.
- **Generador BNF → EOPL/SLLGEN**: el estudiante define sus tokens léxicos y su gramática BNF, y la herramienta genera automáticamente `grammar.rkt`, `main.rkt` (con stubs por completar) y `environment.rkt`.
- **Visualizador de AST**: árbol interactivo del último programa evaluado.
- **Panel de ambiente**: muestra los frames del ambiente de ejecución frame a frame, con soporte para editar el `init-env` desde la interfaz.
- **Consola de ejecución**: envía expresiones al intérprete y muestra los resultados (o los errores TODO pendientes).
- **Ejemplos precargados**: incluye plantillas EOPL completas para referencia.
- **Descarga como ZIP**: genera el proyecto listo para usar en DrRacket, eliminando el código de instrumentación.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, TypeScript 5 |
| Editor | Monaco Editor (`@monaco-editor/react` v4.7, cargado con `ssr: false`) |
| Layout | `react-resizable-panels` v4 (`Group` / `Separator`) |
| Intérprete | Racket (proceso externo, vía `execFile`) |
| Empaquetado | JSZip (descarga del proyecto) |
| Package manager | pnpm |

---

## Especificación léxica

El modal de generación tiene dos áreas de entrada: **Especificación Léxica** y **Gramática BNF**.

En el área léxica se escribe **un nombre de token por línea**. El generador reconoce los siguientes nombres predefinidos y los expande a las reglas SLLGEN correspondientes:

| Nombre | Descripción |
|---|---|
| `number` | Enteros positivos y negativos |
| `float` | Números decimales positivos y negativos |
| `identifier` | Identificadores alfanuméricos (letra seguida de letras, dígitos o `?`) |
| `binary` | Literales binarios con prefijo `b` |
| `octal` | Literales octales con prefijo `0x` |
| `hex` | Literales hexadecimales con prefijo `hx` |
| `text` / `string` | Cadenas entre comillas dobles |

`whitespace` y `comment` (comentarios de línea con `//`) se incluyen **siempre de forma automática**.

Si el área léxica se deja vacía, se incluye el conjunto completo de tokens por defecto (`identifier`, `number`, `float`, `binary`, `octal`, `hex`).

Para un token no listado arriba, se puede escribir directamente la regla en notación SLLGEN empezando con `(`:

```
(boolean ("true") boolean)
(boolean ("false") boolean)
```

---

## Estrategia de integración con Racket

El intérprete no corre en el servidor Next.js — se delega a un proceso Racket externo por cada ejecución:

```
Navegador
   │  POST /api/run  { files[], testInput }
   ▼
API Route (Next.js)
   │  1. Escribe los archivos del proyecto en un directorio temporal
   │  2. Inyecta _runner.rkt (generado en tiempo de ejecución)
   │  3. Lanza:  racket _runner.rkt "<expresión>"
   ▼
Proceso Racket
   │  • _runner.rkt requiere grammar.rkt, environment.rkt, utils.rkt, main.rkt
   │  • Parsea la expresión con el stream-parser del estudiante
   │  • Llama eval-program en un with-handlers (captura errores TODO)
   │  • Serializa AST + resultado + frames de ambiente a JSON
   ▼
API Route
   │  Lee stdout, limpia stderr, devuelve { steps[], stderr }
   ▼
Navegador
   Actualiza AST viewer, panel de ambiente y consola
```

### Instrumentación del ambiente

`environment.rkt` incluye un bloque de tracking (marcado con `FLP-VIEWER-TRACKING-START/END`) que monkey-patchea `extend-env` al iniciarse el módulo. Cada llamada a `extend-env` registra un snapshot del ambiente en `_env-log`. El runner lee ese log al finalizar cada evaluación y lo incluye en el JSON de respuesta. **Este bloque se elimina automáticamente al descargar el ZIP**, dejando el archivo limpio para uso en DrRacket.

---

## Instalación y ejecución local

### Requisitos

- Node.js ≥ 20 y pnpm
- [Racket](https://racket-lang.org/) instalado (por defecto se busca en `/Applications/Racket v9.1/bin/racket`)

### Pasos

```bash
# Clonar e instalar dependencias
pnpm install

# (Opcional) Indicar la ruta al binario de Racket si es diferente
export RACKET_BIN="/usr/local/bin/racket"

# Iniciar el servidor de desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
app/
  api/run/          → API Route que ejecuta Racket
  components/       → Playground, Editor, AST, Ambiente, Consola, Modales
  lib/              → Generadores (BNF, grammar.rkt, main.rkt, environment.rkt)
  services/         → Cliente HTTP hacia /api/run
  types/            → Tipos TypeScript compartidos
examples/           → Plantillas de ejemplo (eopl-template, hola-mundo)
```
