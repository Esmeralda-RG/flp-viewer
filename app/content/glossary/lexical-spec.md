---
term: "lexical-spec"
title: "lexical-spec — especificación léxica"
relatedHelp: sllgen
---
Define los **tokens** que el scanner reconoce: cada entrada tiene un nombre, un patrón (en notación SLLGEN) y un tipo (`number`, `symbol`, `string`, o `skip` para descartarlo, como espacios y comentarios). SLLGEN la usa para partir el texto de entrada en tokens antes de parsear.
