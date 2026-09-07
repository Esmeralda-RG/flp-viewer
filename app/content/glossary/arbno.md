---
term: "arbno"
title: "arbno — repetición cero o más veces"
relatedHelp: bnf
---
Se usa dentro de `lexical-spec` o `grammar` para decir "cero o más repeticiones de esto" (el equivalente de `*` en una expresión regular o en BNF). Por ejemplo, `(letter (arbno (or letter digit)))` describe un identificador: una letra seguida de cualquier cantidad de letras o dígitos.
