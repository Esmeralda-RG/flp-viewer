---
term: "extend-env"
title: "extend-env — agrega ligaduras"
relatedHelp: ambientes
---
Toma una lista de símbolos, sus valores, y un ambiente existente, y devuelve un ambiente nuevo con esas ligaduras agregadas **al frente**. No modifica el ambiente original — por eso un `let` puede "opacar" una variable externa sin borrarla.
