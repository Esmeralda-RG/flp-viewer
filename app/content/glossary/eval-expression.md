---
term: "eval-expression"
title: "eval-expression — el corazón del intérprete"
relatedHelp: evaluacion
---
Recibe una expresión y un ambiente, y decide qué hacer según el tipo de nodo (uno por cada regla de la gramática). La mayoría de los casos siguen el mismo patrón: extraer los campos del nodo, evaluar las sub-expresiones recursivamente y combinar los resultados.
