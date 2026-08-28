---
term: "cases"
title: "cases — pattern matching sobre datatypes"
relatedHelp: evaluacion
---
Macro de EOPL para recorrer un valor creado con `define-datatype` (como una `expression` o un `program`): un caso por cada variante posible (`lit-exp`, `diff-exp`, `if-exp`...), con sus campos ya desestructurados dentro de cada rama. Es el equivalente de un `switch` exhaustivo sobre el tipo del nodo.
