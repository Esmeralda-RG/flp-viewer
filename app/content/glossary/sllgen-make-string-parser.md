---
term: "sllgen:make-string-parser"
title: "sllgen:make-string-parser — construye el parser"
relatedHelp: sllgen
---
Función de SLLGEN que, a partir de `lexical-spec` y `grammar`, construye un parser completo: primero tokeniza el texto según la especificación léxica y luego arma el AST según las reglas de la gramática. El resultado es la función que normalmente se llama `scan&parse`.
