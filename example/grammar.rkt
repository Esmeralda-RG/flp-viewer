#lang eopl

(provide lexical-spec grammar)

(define lexical-spec
'((whitespace
   (whitespace) skip)
  (comment
   ("//" (arbno (not #\newline))) skip)
  (identifier
   (letter (arbno (or letter digit "?"))) symbol)
  (binary
   ("b" (or "0" "1") (arbno (or "0" "1"))) string)
  (binary
   ("-" "b" (or "0" "1") (arbno (or "0" "1"))) string)
  (decimal
   (digit (arbno digit)) number)
  (decimal
   ("-" digit (arbno digit)) number)
  (octal
   ("0x" (or "0" "1" "2" "3" "4" "5" "6" "7")(arbno (or "0" "1" "2" "3" "4" "5" "6" "7"))) string)
  (octal
   ("-" "0x" (or "0" "1" "2" "3" "4" "5" "6" "7") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7"))) string)
  (hex
   ("hx" (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F"))) string)
  (hex
   ("-" "hx" (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F") (arbno (or "0" "1" "2" "3" "4" "5" "6" "7" "8" "9" "A" "B" "C" "D" "E" "F"))) string)
  (float
   (digit (arbno digit) "." digit (arbno digit)) number)
  (float
   ("-" digit (arbno digit) "." digit (arbno digit)) number)
  ))

(define grammar
  '(
    (program ((arbno struct-decl) expression) a-program)
    (expression (bool-expression) bool-exp)
    (expression (identifier) var-exp)
    (expression (number-exp) num-exp)
    (expression ("\"" identifier (arbno identifier) "\"") string-exp)
    (expression (var-decl) decl-exp)
    (expression ("void") void-exp)

    ;; Lists and arrays
    (expression ("list" "(" (separated-list expression ",") ")") list-exp)
    (expression ("cons" "(" expression expression ")") cons-exp)
    (expression ("empty") empty-list-exp)
    (expression ("array" "(" (separated-list expression ",") ")") array-exp)

    ;; Primitive expressions
    (expression ("(" expression num-primitive expression ")") prim-num-exp)
    (expression (bool-primitive "(" (separated-list expression ",") ")") prim-bool-exp)
    (expression (list-primitive "(" expression ")") prim-list-exp)
    (expression (array-primitive "(" (separated-list expression ",") ")") prim-array-exp)
    (expression (string-primitive "(" (separated-list expression ",") ")") prim-string-exp)

    ;; Conditionals
    (expression ("if" expression "{" expression "else" expression "}") if-exp)

    ;; Iterators
    (expression ("for" identifier "from" expression "until" expression "by" expression "do" expression) for-exp)
    (expression ("while" expression "{" expression "}") while-exp)

    ;; Switch
    (expression ("switch" "(" expression ")" "{" (arbno "case" expression ":" expression) "default" ":" expression "}") switch-exp)

    ;; Sequencing and assignment
    (expression ("begin" expression (arbno ";" expression) "end") begin-exp)
    (expression ("set" identifier "=" expression) set-exp)

    ;; Functions
    (expression ("func" "(" (separated-list identifier ",") ")" expression) func-exp)
    (expression ("call" expression "(" (separated-list expression ",") ")") call-exp)

    ;; Struct instantiation and access
    (expression ("new" identifier "(" (separated-list expression ",") ")") new-struct-exp)
    (expression ("get" expression "." identifier) get-struct-exp)
    (expression ("set-struct" expression "." identifier "=" expression) set-struct-exp)

    ;; Pattern matching
    (expression ("match" expression "{" (arbno regular-exp "=>" expression) "}") match-exp)

    ;; number-exp subtypes
    (number-exp (decimal) decimal-num)
    (number-exp (octal) octal-num)
    (number-exp (binary) bin-num)
    (number-exp (hex) hex-num)
    (number-exp (float) float-num)

    ;; bool-expression subtypes
    (bool-expression ("true") true-exp)
    (bool-expression ("false") false-exp)

    ;; Numeric primitives
    (num-primitive ("+") sum-prim)
    (num-primitive ("-") minus-prim)
    (num-primitive ("*") mult-prim)
    (num-primitive ("mod") mod-prim)
    (num-primitive ("pow") pow-prim)
    (num-primitive ("<") lt-prim)
    (num-primitive (">") gt-prim)
    (num-primitive ("<=") le-prim)
    (num-primitive (">=") ge-prim)
    (num-primitive ("!=") neq-prim)
    (num-primitive ("==") eq-prim)

    ;; Boolean primitives
    (bool-primitive ("and") and-prim)
    (bool-primitive ("or") or-prim)
    (bool-primitive ("xor") xor-prim)
    (bool-primitive ("not") not-prim)

    ;; List primitives
    (list-primitive ("first") first-prim)
    (list-primitive ("rest") rest-prim)
    (list-primitive ("empty?") empty?-prim)

    ;; Array primitives
    (array-primitive ("length") arr-length-prim)
    (array-primitive ("index") arr-index-prim)
    (array-primitive ("slice") arr-slice-prim)
    (array-primitive ("setlist") arr-set-prim)

    ;; String primitives
    (string-primitive ("concat") concat-prim)
    (string-primitive ("string-length") str-length-prim)
    (string-primitive ("elementAt") str-index-prim)

    ;; Variable declarations
    (var-decl ("var" (arbno identifier "=" expression) "in" expression) var-let-exp)
    (var-decl ("let" (arbno identifier "=" expression) "in" expression) let-exp)

    ;; Data structures
    (struct-decl ("struct" identifier "{" (arbno identifier) "}") struct-exp)

    ;; Pattern matching rules
    (regular-exp (identifier "::" identifier) list-match-exp)
    (regular-exp ("numero" "(" identifier ")") num-match-exp)
    (regular-exp ("cadena" "(" identifier ")") str-match-exp)
    (regular-exp ("boolean" "(" identifier ")") bool-match-exp)
    (regular-exp ("array" "(" (separated-list identifier ",") ")") array-match-exp)
    (regular-exp ("empty") empty-match-exp)
    (regular-exp ("default") default-match-exp)
    )
  )
