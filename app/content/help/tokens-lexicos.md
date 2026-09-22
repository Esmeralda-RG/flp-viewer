---
id: tokens-lexicos
icon: "🔤"
title: "Tokens del generador BNF"
order: 3.5
relatedExample: hola-mundo
---

# Tokens del generador BNF

El generador BNF → EOPL (`Gramática` en la barra superior) trae una caja de **Especificación Léxica** aparte de la gramática. Ahí defines los tokens que tu lenguaje reconoce, uno por línea.

## Tokens listos para usar

Escribe solo el nombre (en cualquier mayúscula/minúscula) y el generador expande la regla sllgen completa por ti:

| Escribe | Token generado | Acepta | Referéncialo en la BNF como |
|---|---|---|---|
| `number` | `number` | Enteros, con signo opcional: `42`, `-7` | `<number>` |
| `float` | `float` | Decimales, con signo opcional: `3.14`, `-0.5` | `<float>` |
| `identifier` | `identifier` | Letra inicial + letras/dígitos/`?`/`$`: `x`, `contador2`, `ok?` | `<identifier>` |
| `binary` | `binary` | `b` + dígitos 0/1, con signo opcional: `b101`, `-b11` | `<binary>` |
| `octal` | `octal` | `0x` + dígitos 0-7, con signo opcional: `0x17` | `<octal>` |
| `hex` | `hex` | `hx` + dígitos 0-9/A-F, con signo opcional: `hxFF` | `<hex>` |
| `text` **o** `string` | `text` | Cualquier texto entre comillas dobles, sin escapes: `"hola mundo"` | `<text>` |

> **Ojo con `text`/`string`:** aunque puedes escribir cualquiera de los dos nombres en la caja léxica, el token que se genera **siempre se llama `text`**. En la gramática debes escribir `<text>`, no `<string>` — `<string>` no existe como token y SLLGEN lo rechaza con `illegal item string (unknown symbol)`.

`whitespace` y `comment` (comentarios con `%`) se incluyen automáticamente salvo que tú mismo escribas una regla propia para ellos.

Si dejas la caja léxica vacía, se usa un set por defecto: `identifier`, `binary`, `number` (enteros y decimales bajo el mismo token `number`), `octal` y `hex`.

## Cómo se procesa cada línea

Por cada línea no vacía de la caja léxica, el generador decide qué hacer según su forma:

1. **Empieza con `(`** → se usa tal cual, como tu propia regla sllgen cruda.
2. **Es uno de los nombres de la tabla de arriba** → se expande a la regla predefinida.
3. **Cualquier otro nombre** → no se reconoce, y en la previsualización de `grammar.rkt` (a la derecha) aparece un aviso:
   ```
   ; ⚠ "nombre" — falta implementar
   ```
   con una casilla donde puedes escribir la regla directamente; al presionar Enter se rellena sola en tu especificación léxica.

## Crear un token propio

Dos formas de hacerlo, igual de válidas:

**a) Escribir la regla completa tú mismo**, con la sintaxis `(nombre (patrón) tipo)`:

```
(hora (digit digit ":" digit digit) string)
```

**b) Escribir solo el nombre** (`hora`) y completar la regla desde el aviso `; ⚠ falta implementar` que aparece en la previsualización — el resultado es el mismo, solo cambia si la escribes en la caja léxica o en la previsualización.

El `tipo` al final (tercer elemento) le dice a Racket cómo construir el valor del token — no tiene que ver con su nombre:

| Tipo | El valor del token es... |
|---|---|
| `number` | un número de Racket |
| `symbol` | un símbolo de Racket |
| `string` | una cadena de Racket |
| `skip` | se descarta (para whitespace/comentarios) |

Para construir el patrón, la sección **SLLGEN** tiene la tabla de piezas disponibles (`letter`, `digit`, `arbno`, `or`, `not`, literales entre comillas).

## Un ejemplo completo

Agregar un token de fecha `dd/mm/aaaa`:

```
identifier
number
(fecha (digit digit "/" digit digit "/" digit digit digit digit) string)
```

Y en la gramática:

```
<expression> ::= <fecha>   => fecha-exp
```
