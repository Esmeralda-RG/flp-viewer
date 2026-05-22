#lang eopl
(require "grammar.rkt")
(require "environment.rkt")
(require "utils.rkt")

(sllgen:make-define-datatypes lexical-spec grammar)

(define show-the-datatypes
  (lambda () (sllgen:list-define-datatypes lexical-spec grammar)))

; Front-end: lexical scanner + syntactic parser
(define scan&parse
  (sllgen:make-string-parser lexical-spec grammar))

; Interpreter: front-end + evaluation + read prompt
(define interpreter
  (sllgen:make-rep-loop "--> "
    (lambda (pgm) (eval-program pgm))
    (sllgen:make-stream-parser
      lexical-spec
      grammar)))

; eval-program: <program> -> value
(define eval-program
  (lambda (pgm)
    (cases program pgm
      (a-program (lstrc body)
        (let* ([structs (map (lambda (strc) (eval-struct strc)) lstrc)]
               [env (if (null? lstrc)
                        (init-env)
                        (parameterize ([current-env-tag 'program])
                          (extend-env
                           (map (lambda (id) (car id)) structs)
                           (map (lambda (values) (cadr values)) structs)
                           (init-env))))])
          (eval-expression body env))))))

; eval-struct: <struct-decl> -> (list id lids)
(define eval-struct
  (lambda (structs)
    (cases struct-decl structs
      (struct-exp (id lids)
        (list id lids)))))

; eval-expression: <expression> <environment> -> value
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
              (let ([new-env (parameterize ([current-env-tag 'var])
                               (extend-env ids args env))])
                (eval-expression body new-env))))
          (let-exp (ids rands body)
            (let ((args (eval-rands rands env)))
              (if (contains-set? body)
                  (eopl:error 'decl-exp "Cannot use set! in let bindings")
                  (let ([new-env (parameterize ([current-env-tag 'let])
                                   (extend-env ids args env))])
                    (eval-expression body new-env)))))))

      ; Lists and arrays
      (list-exp (lexps)
        (map (lambda (e) (eval-expression e env)) lexps))
      (cons-exp (exp1 exp2)
        (cons (eval-expression exp1 env) (eval-expression exp2 env)))
      (empty-list-exp () '())
      (array-exp (lexp)
        (list->vector (map (lambda (e) (eval-expression e env)) lexp)))

      ; Primitive expressions
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

      ; Conditionals
      (if-exp (test-exp true-exp false-exp)
        (if (eval-expression test-exp env)
            (eval-expression true-exp env)
            (eval-expression false-exp env)))

      ; Iterators
      (for-exp (cond-exp from-exp until-exp by-exp do-exp)
        (let loop ([env   (parameterize ([current-env-tag 'for])
                             (extend-env (list cond-exp) (list (eval-expression from-exp env)) env))]
                   [until (eval-expression until-exp env)]
                   [by    (eval-expression by-exp env)]
                   [result (eval-expression (void-exp) env)])
          (let ([cur (apply-env env cond-exp)])
            (if (< cur until)
                (let ([new-env (parameterize ([current-env-tag 'for])
                                 (extend-env (list cond-exp) (list (+ cur by)) env))])
                  (loop new-env
                      until by
                      (eval-expression do-exp env)))
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

      ; Sequencing and assignment
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

      ; Functions
      (func-exp (lids exp)
        (lambda (args env)
          (let ([new-env (parameterize ([current-env-tag 'call])
                           (extend-env lids args env))])
            (eval-expression exp new-env))))

      (call-exp (exp args)
        (let ([func-val  (eval-expression exp env)]
              [eval-args (map (lambda (a) (eval-expression a env)) args)])
          (apply func-val (list eval-args env))))

      ; Struct instantiation and access
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

      ; Pattern matching
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
                 (let ([new-env (parameterize ([current-env-tag 'match])
                                  (extend-env (list (cadar patterns)) (list match-val) env))])
                   (eval-expression (car match-exps) new-env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(string? match-val)
             (if (eq? (caar patterns) 'str-match)
                 (let ([new-env (parameterize ([current-env-tag 'match])
                                  (extend-env (list (cadar patterns)) (list match-val) env))])
                   (eval-expression (car match-exps) new-env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(boolean? match-val)
             (if (eq? (caar patterns) 'bool-match)
                 (let ([new-env (parameterize ([current-env-tag 'match])
                                  (extend-env (list (cadar patterns)) (list match-val) env))])
                   (eval-expression (car match-exps) new-env))
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
                 (let ([new-env (parameterize ([current-env-tag 'match])
                                  (extend-env (cadar patterns)
                                              (list (car match-val) (cdr match-val))
                                              env))])
                   (eval-expression (car match-exps) new-env))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [(vector? match-val)
             (if (eq? (caar patterns) 'array-match)
                 (if (<= (length (cadar patterns)) (vector-length match-val))
                     (let ([new-env (parameterize ([current-env-tag 'match])
                                      (extend-env (cadar patterns)
                                                  (vector->list
                                                   (array-slice match-val 0
                                                     (- (length (cadar patterns)) 1)))
                                                  env))])
                       (eval-expression (car match-exps) new-env))
                     (eopl:error 'match-exp "Index overflow"))
                 (loop (cdr patterns)
                       (update-default def-match (caar patterns) (car match-exps))
                       (cdr match-exps) match-val))]
            [else
             (loop (cdr patterns)
                   (update-default def-match (caar patterns) (car match-exps))
                   (cdr match-exps) match-val)])))

      )))

; ── helpers ────────────────────────────────────────────────────────────────────

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

; ── primitive dispatchers ──────────────────────────────────────────────────────

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

; ── evaluation helpers ─────────────────────────────────────────────────────────

(define eval-rands
  (lambda (rands env)
    (map (lambda (x) (eval-expression x env)) rands)))

; Prevents set! inside let bindings
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

;(interpreter) ; uncomment to launch the REPL
(provide (all-defined-out))