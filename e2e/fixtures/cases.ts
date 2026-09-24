// Casos 1-39 de "docs/ejemplos-flp-lopez-rivas/pruebas_funcionales/ejemplos_pruebas_funcionales.md".
// Los rótulos de ambiente (empty-env / init-env / extend / asignación) y los
// resultados numéricos/valores se comparan literalmente, tal como el documento
// exige ("Un caso falla si difiere el resultado, si difiere la secuencia o si
// difiere el rótulo de algún ambiente"). Los mensajes de error del documento
// son una descripción del concepto, no el texto literal de Racket, así que esos
// casos solo verifican que el nivel sea "error" y que el mensaje contenga la
// palabra clave relevante (ver `errorContains`).

export interface EnvBindingExpectation {
  name: string
  value: string
}

export interface EnvFrameExpectation {
  label: string
  bindings: EnvBindingExpectation[]
}

export interface StepExpectation {
  output?: string
  errorContains?: string
  environments: EnvFrameExpectation[]
}

export interface TestCase {
  id: number
  exampleId: string
  concept: string
  input: string
  steps: StepExpectation[]
}

function frame(label: string, bindings: EnvBindingExpectation[] = []): EnvFrameExpectation {
  return { label, bindings }
}

function b(name: string, value: string): EnvBindingExpectation {
  return { name, value }
}

const AMBIENTES_INIT = frame('init-env', [b('x', '1'), b('y', '2'), b('z', '3')])

export const CASES: TestCase[] = [
  // 1. Lenguaje LET
  { id: 1, exampleId: 'let-expresiones', concept: 'Literal; el ambiente inicial de este lenguaje es vacío',
    input: '5', steps: [{ output: '5', environments: [frame('empty-env')] }] },
  { id: 2, exampleId: 'let-expresiones', concept: 'Ligadura con let',
    input: 'let x = 5 in -(x, 3)', steps: [{ output: '2', environments: [frame('empty-env'), frame('extend', [b('x', '5')])] }] },
  { id: 3, exampleId: 'let-expresiones', concept: 'let anidado',
    input: 'let x = 10 in let y = -(x, 2) in -(x, y)',
    steps: [{ output: '2', environments: [frame('empty-env'), frame('extend', [b('x', '10')]), frame('extend', [b('y', '8')])] }] },
  { id: 4, exampleId: 'let-expresiones', concept: 'Sombreado',
    input: 'let x = 5 in let x = -(x, 1) in x',
    steps: [{ output: '4', environments: [frame('empty-env'), frame('extend', [b('x', '5')]), frame('extend', [b('x', '4')])] }] },
  { id: 5, exampleId: 'let-expresiones', concept: 'Alcance del cuerpo del let',
    input: 'let x = 3 in -(let x = 10 in x, x)',
    steps: [{ output: '7', environments: [frame('empty-env'), frame('extend', [b('x', '3')]), frame('extend', [b('x', '10')])] }] },
  { id: 6, exampleId: 'let-expresiones', concept: 'Condicional, rama verdadera',
    input: 'if zero?(0) then 1 else 2', steps: [{ output: '1', environments: [frame('empty-env')] }] },
  { id: 7, exampleId: 'let-expresiones', concept: 'Condicional, rama falsa',
    input: 'if zero?(5) then 1 else 2', steps: [{ output: '2', environments: [frame('empty-env')] }] },

  // 2. Ambientes
  { id: 8, exampleId: 'ambientes', concept: 'Búsqueda en el ambiente inicial',
    input: 'x', steps: [{ output: '1', environments: [frame('empty-env'), AMBIENTES_INIT] }] },
  { id: 9, exampleId: 'ambientes', concept: 'Dos búsquedas en el mismo marco',
    input: '-(z, x)', steps: [{ output: '2', environments: [frame('empty-env'), AMBIENTES_INIT] }] },
  { id: 10, exampleId: 'ambientes', concept: 'Sombreado de una variable del ambiente inicial',
    input: 'let x = 10 in -(x, y)',
    steps: [{ output: '8', environments: [frame('empty-env'), AMBIENTES_INIT, frame('extend', [b('x', '10')])] }] },
  { id: 11, exampleId: 'ambientes', concept: 'let no es recursivo',
    input: 'let x = -(x, 1) in x',
    steps: [{ output: '0', environments: [frame('empty-env'), AMBIENTES_INIT, frame('extend', [b('x', '0')])] }] },
  { id: 12, exampleId: 'ambientes', concept: 'Orden de las extensiones y valor capturado',
    input: 'let y = x in let x = 100 in -(x, y)',
    steps: [{ output: '99', environments: [frame('empty-env'), AMBIENTES_INIT, frame('extend', [b('y', '1')]), frame('extend', [b('x', '100')])] }] },

  // 3. Procedimientos y cierres
  { id: 13, exampleId: 'cierres', concept: 'Aplicación: el parámetro se liga al argumento',
    input: '(proc (x) -(x, 1) 5)', steps: [{ output: '4', environments: [frame('empty-env'), frame('extend', [b('x', '5')])] }] },
  { id: 14, exampleId: 'cierres', concept: 'Procedimiento como valor ligado a un nombre',
    input: 'let f = proc (x) -(x, 1) in (f 10)',
    steps: [{ output: '9', environments: [frame('empty-env'), frame('extend', [b('f', '<procedure>')]), frame('extend', [b('x', '10')])] }] },
  { id: 15, exampleId: 'cierres', concept: 'Alcance estático: f usa la x de su creación',
    input: 'let x = 200 in let f = proc (z) -(z, x) in let x = 100 in (f 1)',
    steps: [{ output: '-199', environments: [
      frame('empty-env'), frame('extend', [b('x', '200')]), frame('extend', [b('f', '<procedure>')]),
      frame('extend', [b('x', '100')]), frame('extend', [b('z', '1')]),
    ] }] },
  { id: 16, exampleId: 'cierres', concept: 'Alcance estático entre dos procedimientos',
    input: 'let x = 1 in let f = proc (y) -(y, x) in let g = proc (x) (f x) in (g 10)',
    steps: [{ output: '9', environments: [
      frame('empty-env'), frame('extend', [b('x', '1')]), frame('extend', [b('f', '<procedure>')]),
      frame('extend', [b('g', '<procedure>')]), frame('extend', [b('x', '10')]), frame('extend', [b('y', '10')]),
    ] }] },
  { id: 17, exampleId: 'cierres', concept: 'Orden superior y currificación',
    input: 'let f = proc (x) proc (y) -(x, y) in ((f 10) 3)',
    steps: [{ output: '7', environments: [
      frame('empty-env'), frame('extend', [b('f', '<procedure>')]), frame('extend', [b('x', '10')]), frame('extend', [b('y', '3')]),
    ] }] },
  { id: 18, exampleId: 'cierres', concept: 'Un proc sin aplicar es un valor',
    input: 'proc (x) x', steps: [{ output: '<procedure>', environments: [frame('empty-env')] }] },

  // 4. Estado y asignación
  { id: 19, exampleId: 'estado', concept: 'set sobrescribe la celda',
    input: 'let x = 5 in begin set x = 10 ; x end',
    steps: [{ output: '10', environments: [frame('empty-env'), frame('extend', [b('x', '5')]), frame('asignación', [b('x', '10')])] }] },
  { id: 20, exampleId: 'estado', concept: 'Secuenciación con begin',
    input: 'let x = 5 in begin set x = -(x, 1) ; set x = -(x, 1) ; x end',
    steps: [{ output: '3', environments: [
      frame('empty-env'), frame('extend', [b('x', '5')]), frame('asignación', [b('x', '4')]), frame('asignación', [b('x', '3')]),
    ] }] },
  { id: 21, exampleId: 'estado', concept: 'Ligadura frente a asignación',
    input: 'let x = 5 in begin let x = 1 in set x = 9 ; x end',
    steps: [{ output: '5', environments: [
      frame('empty-env'), frame('extend', [b('x', '5')]), frame('extend', [b('x', '1')]), frame('asignación', [b('x', '9')]),
    ] }] },
  { id: 22, exampleId: 'estado', concept: 'begin devuelve el valor de la última expresión',
    input: 'begin 1 ; 2 ; 3 end', steps: [{ output: '3', environments: [frame('empty-env')] }] },

  // 5. Procedimientos con estado
  { id: 23, exampleId: 'cierres-y-estado', concept: 'set sobre una celda capturada por un cierre',
    input: 'let x = 1 in let f = proc (d) set x = -(x, d) in begin (f 1) ; (f 1) ; x end',
    steps: [{ output: '-1', environments: [
      frame('empty-env'), frame('extend', [b('x', '1')]), frame('extend', [b('f', '<procedure>')]),
      frame('extend', [b('d', '1')]), frame('asignación', [b('x', '0')]),
      frame('extend', [b('d', '1')]), frame('asignación', [b('x', '-1')]),
    ] }] },
  { id: 24, exampleId: 'cierres-y-estado', concept: 'El cierre guarda la celda, no una copia del valor',
    input: 'let x = 10 in let f = proc (y) -(x, y) in begin set x = 20 ; (f 5) end',
    steps: [{ output: '15', environments: [
      frame('empty-env'), frame('extend', [b('x', '10')]), frame('extend', [b('f', '<procedure>')]),
      frame('asignación', [b('x', '20')]), frame('extend', [b('y', '5')]),
    ] }] },
  { id: 25, exampleId: 'cierres-y-estado', concept: 'El set sobre el parámetro no toca la variable externa',
    input: 'let x = 10 in let f = proc (x) begin set x = 0 ; x end in begin (f 5) ; x end',
    steps: [{ output: '10', environments: [
      frame('empty-env'), frame('extend', [b('x', '10')]), frame('extend', [b('f', '<procedure>')]),
      frame('extend', [b('x', '5')]), frame('asignación', [b('x', '0')]),
    ] }] },
  { id: 26, exampleId: 'cierres-y-estado', concept: 'Contador con estado compartido entre llamadas',
    input: 'let c = 0 in let inc = proc (d) begin set c = -(c, -(0, d)) ; c end in begin (inc 1) ; (inc 1) ; (inc 1) end',
    steps: [{ output: '3', environments: [
      frame('empty-env'), frame('extend', [b('c', '0')]), frame('extend', [b('inc', '<procedure>')]),
      frame('extend', [b('d', '1')]), frame('asignación', [b('c', '1')]),
      frame('extend', [b('d', '1')]), frame('asignación', [b('c', '2')]),
      frame('extend', [b('d', '1')]), frame('asignación', [b('c', '3')]),
    ] }] },

  // 6. Errores del lenguaje
  { id: 27, exampleId: 'let-expresiones', concept: 'Variable no ligada en ambiente vacío',
    input: '-(x, 1)', steps: [{ errorContains: 'x', environments: [frame('empty-env')] }] },
  { id: 28, exampleId: 'ambientes', concept: 'La búsqueda recorre todos los marcos y falla al llegar al vacío',
    input: 'a', steps: [{ errorContains: 'a', environments: [frame('empty-env'), AMBIENTES_INIT] }] },
  { id: 29, exampleId: 'estado', concept: 'set exige una ligadura existente',
    input: 'set y = 1', steps: [{ errorContains: 'y', environments: [frame('empty-env')] }] },
  { id: 30, exampleId: 'let-expresiones', concept: 'Error de tipo: resta de un booleano',
    input: '-(zero?(0), 1)', steps: [{ errorContains: '', environments: [frame('empty-env')] }] },
  { id: 31, exampleId: 'cierres', concept: 'Aplicación de un valor que no es procedimiento',
    input: '(5 3)', steps: [{ errorContains: '5', environments: [frame('empty-env')] }] },
  { id: 32, exampleId: 'let-expresiones', concept: 'Error sintáctico reportado, no silenciado',
    input: '-(5, 3', steps: [{ errorContains: '', environments: [] }] },

  // 7. Flujo de varios programas (requiere "Paso a paso" activo)
  { id: 33, exampleId: 'let-expresiones', concept: 'Tres programas, tres pasos',
    input: '1 2 3', steps: [
      { output: '1', environments: [frame('empty-env')] },
      { output: '2', environments: [frame('empty-env')] },
      { output: '3', environments: [frame('empty-env')] },
    ] },
  { id: 34, exampleId: 'let-expresiones', concept: 'La ligadura de un programa no pasa al siguiente',
    input: 'let x = 1 in x  x', steps: [
      { output: '1', environments: [frame('empty-env'), frame('extend', [b('x', '1')])] },
      { errorContains: 'x', environments: [frame('empty-env')] },
    ] },
  { id: 35, exampleId: 'let-expresiones', concept: 'El rótulo de la primera ligadura es extend también en el segundo programa',
    input: '5  let x = 1 in x', steps: [
      { output: '5', environments: [frame('empty-env')] },
      { output: '1', environments: [frame('empty-env'), frame('extend', [b('x', '1')])] },
    ] },
  { id: 36, exampleId: 'ambientes', concept: 'Cada programa vuelve a construir el ambiente inicial',
    input: 'x  let x = 5 in -(x, y)  z', steps: [
      { output: '1', environments: [frame('empty-env'), AMBIENTES_INIT] },
      { output: '3', environments: [frame('empty-env'), AMBIENTES_INIT, frame('extend', [b('x', '5')])] },
      { output: '3', environments: [frame('empty-env'), AMBIENTES_INIT] },
    ] },
  { id: 37, exampleId: 'cierres-y-estado', concept: 'El estado de un programa no persiste en el siguiente',
    input: 'let x = 1 in begin set x = 2 ; x end  x', steps: [
      { output: '2', environments: [frame('empty-env'), frame('extend', [b('x', '1')]), frame('asignación', [b('x', '2')])] },
      { errorContains: 'x', environments: [frame('empty-env')] },
    ] },

  // 8. Léxico del curso
  { id: 38, exampleId: 'let-expresiones', concept: 'Comentario con %, como en el material del curso',
    input: '% comentario del curso\nlet a = 4 in -(a, 1)',
    steps: [{ output: '3', environments: [frame('empty-env'), frame('extend', [b('a', '4')])] }] },
  { id: 39, exampleId: 'let-expresiones', concept: 'Identificador con $',
    input: 'let a$ = 4 in -(a$, 1)',
    steps: [{ output: '3', environments: [frame('empty-env'), frame('extend', [b('a$', '4')])] }] },
]
