---
term: "sllgen:make-stream-parser"
title: "sllgen:make-stream-parser — parser en modo flujo"
relatedHelp: uso
---
Variante de `scan&parse` que en vez de devolver un único AST, entrega un *stream* de programas. FLP Viewer la usa para el modo **paso a paso**: cada vez que pides "siguiente paso", el intérprete avanza al próximo elemento del stream sin volver a parsear todo desde cero.
