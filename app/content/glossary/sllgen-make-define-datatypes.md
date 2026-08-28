---
term: "sllgen:make-define-datatypes"
title: "sllgen:make-define-datatypes — genera los tipos del AST"
relatedHelp: sllgen
---
Lee `lexical-spec` y `grammar` (definidos en `grammar.rkt`) y crea automáticamente los tipos de datos del AST: uno por cada no-terminal, con un constructor por cada producción (`a-program`, `lit-exp`, `diff-exp`...). Gracias a esta línea puedes usar `cases` más abajo para recorrer el árbol.
