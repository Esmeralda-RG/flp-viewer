---
term: "eval-program"
title: "eval-program — punto de entrada de la evaluación"
relatedHelp: evaluacion
---
Recibe el AST completo (un `program`) y arranca la evaluación: extrae la expresión principal y la evalúa con `eval-expression`, partiendo del ambiente inicial (`init-env`). Es la primera función que se llama después de parsear.
