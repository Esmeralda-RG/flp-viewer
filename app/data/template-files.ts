// ─────────────────────────────────────────────────────────────────────────────
// EOPL interpreter template — English translation of proyecto_template
// Universidad del Valle · FLP Viewer
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_GRAMMAR = String.raw`#lang eopl

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

    ;; Listas y arreglos
    (expression ("list" "(" (separated-list expression ",") ")") list-exp)
    (expression ("cons" "(" expression expression ")") cons-exp)
    (expression ("empty") empty-list-exp)
    (expression ("array" "(" (separated-list expression ",") ")") array-exp)

    ;; Expresiones primitivas
    (expression ("(" expression num-primitive expression ")") prim-num-exp)
    (expression (bool-primitive "(" (separated-list expression ",") ")") prim-bool-exp)
    (expression (list-primitive "(" expression ")") prim-list-exp)
    (expression (array-primitive "(" (separated-list expression ",") ")") prim-array-exp)
    (expression (string-primitive "(" (separated-list expression ",") ")") prim-string-exp)

    ;; Condicionales
    (expression ("if" expression "{" expression "else" expression "}") if-exp)

    ;; Iteradores
    (expression ("for" identifier "from" expression "until" expression "by" expression "do" expression) for-exp)
    (expression ("while" expression "{" expression "}") while-exp)

    ;; Switch
    (expression ("switch" "(" expression ")" "{" (arbno "case" expression ":" expression) "default" ":" expression "}") switch-exp)

    ;; Secuenciación y asignación
    (expression ("begin" expression (arbno ";" expression) "end") begin-exp)
    (expression ("set" identifier "=" expression) set-exp)

    ;; Funciones
    (expression ("func" "(" (separated-list identifier ",") ")" expression) func-exp)
    (expression ("call" expression "(" (separated-list expression ",") ")") call-exp)

    ;; Instanciación y uso de estructuras
    (expression ("new" identifier "(" (separated-list expression ",") ")") new-struct-exp)
    (expression ("get" expression "." identifier) get-struct-exp)
    (expression ("set-struct" expression "." identifier "=" expression) set-struct-exp)

    ;; Reconocimiento de patrones
    (expression ("match" expression "{" (arbno regular-exp "=>" expression) "}") match-exp)

    ;; Subtipos de number-exp
    (number-exp (decimal) decimal-num)
    (number-exp (octal) octal-num)
    (number-exp (binary) bin-num)
    (number-exp (hex) hex-num)
    (number-exp (float) float-num)

    ;; Subtipos de bool-expression
    (bool-expression ("true") true-exp)
    (bool-expression ("false") false-exp)

    ;; Primitivas numéricas
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

    ;; Primitivas booleanas
    (bool-primitive ("and") and-prim)
    (bool-primitive ("or") or-prim)
    (bool-primitive ("xor") xor-prim)
    (bool-primitive ("not") not-prim)

    ;; Primitivas de listas
    (list-primitive ("first") first-prim)
    (list-primitive ("rest") rest-prim)
    (list-primitive ("empty?") empty?-prim)

    ;; Primitivas de arreglos
    (array-primitive ("length") arr-length-prim)
    (array-primitive ("index") arr-index-prim)
    (array-primitive ("slice") arr-slice-prim)
    (array-primitive ("setlist") arr-set-prim)

    ;; Primitivas de cadenas
    (string-primitive ("concat") concat-prim)
    (string-primitive ("string-length") str-length-prim)
    (string-primitive ("elementAt") str-index-prim)

    ;; Declaraciones de variables
    (var-decl ("var" (arbno identifier "=" expression) "in" expression) var-let-exp)
    (var-decl ("let" (arbno identifier "=" expression) "in" expression) let-exp)

    ;; Estructuras de datos
    (struct-decl ("struct" identifier "{" (arbno identifier) "}") struct-exp)

    ;; Reglas de reconocimiento de patrones
    (regular-exp (identifier "::" identifier) list-match-exp)
    (regular-exp ("numero" "(" identifier ")") num-match-exp)
    (regular-exp ("cadena" "(" identifier ")") str-match-exp)
    (regular-exp ("boolean" "(" identifier ")") bool-match-exp)
    (regular-exp ("array" "(" (separated-list identifier ",") ")") array-match-exp)
    (regular-exp ("empty") empty-match-exp)
    (regular-exp ("default") default-match-exp)
    )
  )
`

export const TEMPLATE_ENVIRONMENT = `#lang eopl

(provide (all-defined-out))

;; Representa un ambiente (entorno) como un registro.
(define-datatype environment environment?
  (empty-env-record)
  (extended-env-record
   (syms (list-of symbol?))
   (vec vector?)
   (env environment?)))

;; Representa una referencia al vector de valores del ambiente.
(define-datatype reference reference?
  (a-ref (position integer?)
         (vec vector?)))

(define empty-env
  (lambda ()
    (empty-env-record)))

(define extend-env
  (lambda (syms vals env)
    (extended-env-record syms (list->vector vals) env)))

(define apply-env-ref
  (lambda (env sym)
    (cases environment env
      (empty-env-record ()
        (eopl:error 'apply-env-ref "No binding for ~s" sym))
      (extended-env-record (syms vals env)
        (let ((pos (rib-find-position sym syms)))
          (if (number? pos)
              (a-ref pos vals)
              (apply-env-ref env sym)))))))

(define deref
  (lambda (ref)
    (primitive-deref ref)))

(define primitive-deref
  (lambda (ref)
    (cases reference ref
      (a-ref (pos vec)
        (vector-ref vec pos)))))

(define setref!
  (lambda (ref val)
    (primitive-setref! ref val)))

(define primitive-setref!
  (lambda (ref val)
    (cases reference ref
      (a-ref (pos vec)
        (vector-set! vec pos val)))))

(define rib-find-position
  (lambda (sym los)
    (list-find-position sym los)))

(define list-find-position
  (lambda (sym los)
    (list-index (lambda (sym1) (eqv? sym1 sym)) los)))

(define list-index
  (lambda (pred ls)
    (cond
      ((null? ls) #f)
      ((pred (car ls)) 0)
      (else (let ((r (list-index pred (cdr ls))))
              (if (number? r) (+ r 1) #f))))))

(define apply-env
  (lambda (env sym)
    (deref (apply-env-ref env sym))))

(define init-env
  (lambda ()
    (extend-env
     '(x y z)
     '(1 2 3)
     (empty-env))))
`

export const TEMPLATE_UTILS = `#lang racket

;; Funciones utilitarias para el intérprete EOPL
;; Generado por FLP Viewer — Universidad del Valle

(provide to-decimal from-decimal convert-string operation-numerical array-slice is-number?)

;; Convierte una cadena numérica de una base dada a decimal.
(define (to-decimal num base)
  (cond
    [(eq? base 'd) num]
    [(eq? base 'b) (string->number (string-replace (to-string num) "b" "") 2)]
    [(eq? base 'o) (string->number (string-replace (to-string num) "0x" "") 8)]
    [(eq? base 'h) (string->number (string-replace (to-string num) "hx" "") 16)]))

;; Convierte un número decimal a cadena en la base dada.
(define (from-decimal num base)
  (convert-string (prefix-base base (cond
    [(eq? base 'd) (number->string num)]
    [(eq? base 'b) (number->string num 2)]
    [(eq? base 'o) (number->string num 8)]
    [(eq? base 'h) (string-upcase (number->string num 16))]))))

(define (string-contains-letters? str)
  (regexp-match? #rx"[A-Za-z]" str))

;; Convierte un token string a número o símbolo.
(define (convert-string str)
  (if (string-contains-letters? str)
      (string->symbol str)
      (string->number str)))

(define _prefix-base
  (lambda (base)
    (cond
      [(eq? base 'd) ""]
      [(eq? base 'b) "b"]
      [(eq? base 'o) "0x"]
      [(eq? base 'h) "hx"])))

(define prefix-base
  (lambda (base num)
    (if (string-contains? num "-")
      (string-append "-" (_prefix-base base) (string-replace num "-" ""))
      (string-append (_prefix-base base) num))))

(define to-string
  (lambda (x)
    (cond
      [(string? x) x]
      [(symbol? x) (symbol->string x)]
      [(number? x) (number->string x)])))

(define extract-base
  (lambda (str)
    (cond
      [(string-contains? str "b") 'b]
      [(string-contains? str "0x") 'o]
      [(string-contains? str "hx") 'h]
      [else 'd])))

;; Aplica una operación numérica respetando la base de los operandos.
(define operation-numerical
  (lambda (op num1 num2 boolean?)
    (let ([base (extract-base (to-string num1))]
          [n1   (to-decimal num1 (extract-base (to-string num1)))]
          [n2   (to-decimal num2 (extract-base (to-string num2)))])
      (if boolean?
          (op n1 n2)
          (from-decimal (op n1 n2) base)))))

;; Retorna un sub-vector de start a end (inclusivo).
(define array-slice
  (lambda (v start end)
    (let ((len (+ 1 (- end start))))
      (build-vector len (lambda (i) (vector-ref v (+ i start)))))))

;; Retorna #t si x es numérico (número o token string no decimal).
(define is-number?
  (lambda (x)
    (cond
      [(number? x) #t]
      [(string? x) (not (eq? (extract-base x) 'd))]
      [else #f])))
`

export const TEMPLATE_MAIN = `#lang eopl
(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

(define show-the-datatypes
  (lambda () (sllgen:list-define-datatypes lexical-spec grammar)))

; Front-end: análisis léxico (scanner) y sintáctico (parser)
(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

; Intérprete: front-end + evaluación + señal de lectura
(define interpreter
  (sllgen:make-rep-loop "--> "
    (lambda (pgm) (eval-program pgm))
    (sllgen:make-stream-parser
      lexical-spec
      grammar)))

; eval-program: <program> -> valor
(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (lstrc body)
        (cond
          [(null? lstrc) (eval-expression body (init-env))]
          [else
            (let ([structs (map (lambda (strc) (eval-struct strc)) lstrc)])
              (eval-expression body
                (extend-env
                  (map (lambda (id) (car id)) structs)
                  (map (lambda (values) (cadr values)) structs)
                  (init-env))))])))))

; eval-struct: <struct-decl> -> (list id lids)
(define eval-struct
  (lambda (structs)
    (cases struct-decl structs
      (struct-exp (id lids)
        (list id lids)))))

; eval-expression: <expression> <environment> -> valor
(define eval-expression
  (lambda (exp env)
    (cases expression exp

      (bool-exp (bool)
        (cases bool-expression bool
          (true-exp  () #T)
          (false-exp () #F)))

      (void-exp () 'void)

      (var-exp (id) (apply-env env id))

      (num-exp (num)
        (cases number-exp num
          (decimal-num (n) n)
          (octal-num   (n) (convert-string n))
          (bin-num     (n) (convert-string n))
          (hex-num     (n) (convert-string n))
          (float-num   (n) n)))

      (string-exp (id1 id2)
        (letrec ([build-str
                  (lambda (lids)
                    (if (null? lids) ""
                        (string-append " "
                          (symbol->string (car lids))
                          (build-str (cdr lids)))))])
          (string-append (symbol->string id1) (build-str id2))))

      (decl-exp (dcl)
        (cases var-decl dcl
          (var-let-exp (ids rands body)
            (let ((args (eval-rands rands env)))
              (eval-expression body (extend-env ids args env))))
          (let-exp (ids rands body)
            (let ((args (eval-rands rands env)))
              (if (contains-set? body)
                  (eopl:error 'decl-exp "Cannot use set! in let bindings")
                  (eval-expression body (extend-env ids args env)))))))

      ; Listas y arreglos
      (list-exp (lexps)
        (map (lambda (e) (eval-expression e env)) lexps))
      (cons-exp (exp1 exp2)
        (cons (eval-expression exp1 env) (eval-expression exp2 env)))
      (empty-list-exp () '())
      (array-exp (lexp)
        (list->vector (map (lambda (e) (eval-expression e env)) lexp)))

      ; Expresiones primitivas
      (prim-num-exp (exp1 prim exp2)
        (apply-num-primitive prim
          (eval-expression exp1 env)
          (eval-expression exp2 env)))
      (prim-bool-exp (prim lexps)
        (apply-bool-primitive prim
          (map (lambda (e)
                 (let ([v (eval-expression e env)])
                   (if (boolean? v) v
                       (eopl:error 'prim-bool-exp "Non-boolean argument"))))
               lexps)))
      (prim-list-exp (prim exp)
        (apply-list-primitive prim (eval-expression exp env)))
      (prim-array-exp (prim lexps)
        (apply-array-primitive prim (eval-rands lexps env)))
      (prim-string-exp (prim lexps)
        (apply-string-primitive prim
          (map (lambda (e) (eval-expression e env)) lexps)))

      ; Condicionales
      (if-exp (test-exp true-exp false-exp)
        (if (eval-expression test-exp env)
            (eval-expression true-exp env)
            (eval-expression false-exp env)))

      ; Iteradores
      (for-exp (cond-exp from-exp until-exp by-exp do-exp)
        (let loop ([env   (extend-env (list cond-exp) (list (eval-expression from-exp env)) env)]
                   [until (eval-expression until-exp env)]
                   [by    (eval-expression by-exp env)]
                   [result (eval-expression (void-exp) env)])
          (let ([cur (apply-env env cond-exp)])
            (if (< cur until)
                (loop (extend-env (list cond-exp) (list (+ cur by)) env)
                      until by
                      (eval-expression do-exp env))
                result))))

      (while-exp (cond-exp exp)
        (let loop ([cond (eval-expression cond-exp env)]
                   [last (eval-expression (void-exp) env)])
          (if (not cond) last
              (let ([value (eval-expression exp env)])
                (loop (eval-expression cond-exp env) value)))))

      ; Switch
      (switch-exp (cond-exp case-exp lexps default-exp)
        (let loop ([match-val (eval-expression cond-exp env)]
                   [cases     (map (lambda (e) (eval-expression e env)) lexps)]
                   [exps      lexps])
          (cond
            [(null? cases) (eval-expression default-exp env)]
            [(eq? match-val (car cases)) (eval-expression (car exps) env)]
            [else (loop match-val (cdr cases) (cdr exps))])))

      ; Secuenciación y asignación
      (begin-exp (exp exps)
        (let loop ([acc  (eval-expression exp env)]
                   [rest exps])
          (if (null? rest) acc
              (loop (eval-expression (car rest) env) (cdr rest)))))

      (set-exp (id rhs-exp)
        (eval-expression
          (begin
            (setref! (apply-env-ref env id) (eval-expression rhs-exp env))
            (void-exp))
          env))

      ; Funciones
      (func-exp (lids exp)
        (lambda (args env)
          (eval-expression exp (extend-env lids args env))))

      (call-exp (exp args)
        (let ([func-val  (eval-expression exp env)]
              [eval-args (map (lambda (a) (eval-expression a env)) args)])
          (apply func-val (list eval-args env))))

      ; Instanciación y uso de estructuras
      (new-struct-exp (id lexps)
        (let* ([struct-def (apply-env env id)])
          (if (= (length lexps) (length struct-def))
              (list->vector (list id (map (lambda (e) (eval-expression e env)) lexps)))
              (eopl:error 'new-struct-exp "Wrong number of attributes"))))

      (get-struct-exp (exp id)
        (let* ([s      (eval-expression exp env)]
               [fields (apply-env env (vector-ref s 0))]
               [vals   (vector-ref s 1)])
          (let loop ([fs fields] [vs vals])
            (cond
              [(null? fs) (eopl:error 'get-struct-exp "Attribute not found: ~s" id)]
              [(eq? (car fs) id) (car vs)]
              [else (loop (cdr fs) (cdr vs))]))))

      (set-struct-exp (exp1 id exp2)
        (eval-expression
          (begin
            (let* ([s      (eval-expression exp1 env)]
                   [fields (apply-env env (vector-ref s 0))]
                   [vals   (vector-ref s 1)])
              (vector-set! s 1
                (let loop ([fs fields] [vs vals] [acc '()])
                  (cond
                    [(null? fs) (eopl:error 'set-struct-exp "Attribute not found: ~s" id)]
                    [(eq? id (car fs)) (append acc (list (eval-expression exp2 env)))]
                    [else (loop (cdr fs) (cdr vs) (append acc (list (car vs))))])))))
          (void-exp))
        env)

      ; Reconocimiento de patrones
      (match-exp (exp rexps lexps)
        (let loop ([patterns   (map apply-regular-exp rexps)]
                   [def-match  (list #f)]
                   [match-exps lexps]
                   [match-val  (eval-expression exp env)])
          (cond
            [(and (null? patterns) (not (car def-match)))
             (eopl:error 'match-exp "No match found")]
            [(null? patterns)
             (eval-expression (cadr def-match) env)]
            [(is-number? match-val)
             (if (eq? (caar patterns) 'num-match)
                 (eval-expression (car match-exps)
                   (extend-env (list (cadar patterns)) (list match-val) env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(string? match-val)
             (if (eq? (caar patterns) 'str-match)
                 (eval-expression (car match-exps)
                   (extend-env (list (cadar patterns)) (list match-val) env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(boolean? match-val)
             (if (eq? (caar patterns) 'bool-match)
                 (eval-expression (car match-exps)
                   (extend-env (list (cadar patterns)) (list match-val) env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(null? match-val)
             (if (eq? (caar patterns) 'empty-match)
                 (eval-expression (car match-exps) env)
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(list? match-val)
             (if (eq? (caar patterns) 'list-match)
                 (eval-expression (car match-exps)
                   (extend-env (cadar patterns)
                     (list (car match-val) (cdr match-val)) env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(vector? match-val)
             (if (eq? (caar patterns) 'array-match)
                 (if (<= (length (cadar patterns)) (vector-length match-val))
                     (eval-expression (car match-exps)
                       (extend-env (cadar patterns)
                         (vector->list
                           (array-slice match-val 0
                             (- (length (cadar patterns)) 1)))
                         env))
                     (eopl:error 'match-exp "Index overflow"))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [else
             (loop (cdr patterns)
                   (update-default def-match (caar patterns) (car match-exps))
                   (cdr match-exps) match-val)])))

      )))

; ── auxiliares ──────────────────────────────────────────────────────────────────

(define update-default
  (lambda (current regular exp)
    (cond
      [(eq? regular 'default-match) (list #t exp)]
      [(car current) current]
      [else (list #f)])))

(define apply-regular-exp
  (lambda (regular)
    (cases regular-exp regular
      (list-match-exp  (id1 id2) (list 'list-match  (list id1 id2)))
      (num-match-exp   (id)      (list 'num-match   id))
      (str-match-exp   (id)      (list 'str-match   id))
      (bool-match-exp  (id)      (list 'bool-match  id))
      (array-match-exp (ids)     (list 'array-match ids))
      (empty-match-exp ()        '(empty-match))
      (default-match-exp ()      '(default-match)))))

; ── despacho de primitivas ──────────────────────────────────────────────────────

(define apply-num-primitive
  (lambda (prim num1 num2)
    (cases num-primitive prim
      (sum-prim   () (operation-numerical +      num1 num2 #F))
      (minus-prim () (operation-numerical -      num1 num2 #F))
      (mult-prim  () (operation-numerical *      num1 num2 #F))
      (mod-prim   () (operation-numerical modulo num1 num2 #F))
      (pow-prim   () (operation-numerical expt   num1 num2 #F))
      (lt-prim    () (operation-numerical <      num1 num2 #T))
      (gt-prim    () (operation-numerical >      num1 num2 #T))
      (le-prim    () (operation-numerical <=     num1 num2 #T))
      (ge-prim    () (operation-numerical >=     num1 num2 #T))
      (neq-prim   () (not (operation-numerical eq? num1 num2 #T)))
      (eq-prim    () (operation-numerical eq?    num1 num2 #T)))))

(define apply-bool-primitive
  (lambda (prim args)
    (cases bool-primitive prim
      (and-prim () (let loop ([args args])
                     (if (null? args) #t
                         (if (not (car args)) #f (loop (cdr args))))))
      (or-prim  () (let loop ([args args])
                     (if (null? args) #f
                         (if (car args) #t (loop (cdr args))))))
      (xor-prim () (and (or (car args) (cadr args))
                        (not (and (car args) (cadr args)))))
      (not-prim () (not (car args))))))

(define apply-list-primitive
  (lambda (prim args)
    (cases list-primitive prim
      (first-prim  () (car args))
      (rest-prim   () (cdr args))
      (empty?-prim () (null? args)))))

(define apply-array-primitive
  (lambda (prim args)
    (cases array-primitive prim
      (arr-length-prim () (vector-length (car args)))
      (arr-index-prim  () (vector-ref (car args) (cadr args)))
      (arr-slice-prim  () (array-slice (car args) (cadr args) (caddr args)))
      (arr-set-prim    () (vector-set! (car args) (cadr args) (caddr args))
                          (car args)))))

(define apply-string-primitive
  (lambda (prim args)
    (cases string-primitive prim
      (concat-prim     () (apply string-append args))
      (str-length-prim () (string-length (car args)))
      (str-index-prim  () (string (string-ref (car args) (cadr args)))))))

; ── auxiliares de evaluación ───────────────────────────────────────────────────

(define eval-rands
  (lambda (rands env)
    (map (lambda (x) (eval-expression x env)) rands)))

; Detecta uso de set! dentro de bindings let
(define contains-set?
  (lambda (expr)
    (cases expression expr
      (set-exp   (id rhs-exp) #t)
      (begin-exp (exp exps)
        (or (contains-set? exp)
            (let loop ([rest exps])
              (if (null? rest) #f
                  (or (contains-set? (car rest))
                      (loop (cdr rest)))))))
      (if-exp    (test t f)   (or (contains-set? t) (contains-set? f)))
      (else #f))))

; (interpreter) ; descomentar para iniciar el REPL
`
