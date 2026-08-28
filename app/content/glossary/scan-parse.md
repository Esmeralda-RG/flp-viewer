---
term: "scan&parse"
title: "scan&parse — convierte texto en AST"
relatedHelp: sllgen
---
Es el **scanner + parser** generado por SLLGEN: recibe el texto que el estudiante escribe en la consola y lo convierte en un AST (un valor `program`), listo para que `eval-program` lo evalúe. Se define como `(sllgen:make-string-parser lexical-spec grammar)`.
