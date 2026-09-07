---
term: "define-datatype"
title: "define-datatype — tipos de datos variantes"
relatedHelp: ambientes
---
Macro de EOPL para definir un tipo con varias "formas" posibles (variantes), cada una con sus propios campos — como `environment`, que puede ser `empty-env-record` o `extended-env-record`. Los valores creados así se recorren con `cases`.
