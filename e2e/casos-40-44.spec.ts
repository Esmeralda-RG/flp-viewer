import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import {
  activateSession, submit, readConsoleLines,
  selectFileTab, setActiveFileContent, openGrammarModal, closeGrammarModal,
  setLexInput, setGrammarInput, readGrammarPreview, readGrammarError,
} from './helpers'


const CURSO_DIR = path.join(__dirname, '..', 'examples', 'curso-primitivas')

function readCurso(name: string): string {
  return fs.readFileSync(path.join(CURSO_DIR, name), 'utf8')
}

test.describe('Editor de gramáticas (casos 40-41, 44)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const empezar = page.getByRole('button', { name: '¡Empezar!' })
    if (await empezar.isVisible().catch(() => false)) await empezar.click()
    await openGrammarModal(page)
    await setLexInput(page, '')
  })

  test('caso 40: notación SLLGEN (separated-list ...) del curso se traduce sin corromper la gramática', async ({ page }) => {
    const grammar = [
      '<program> ::= <expression> => a-program',
      '<expression> ::= <number> => lit-exp',
      '<expression> ::= <identifier> => var-exp',
      '<expression> ::= <primitive> "(" (separated-list <expression> ",") ")" => primapp-exp',
      '<primitive> ::= "+" => add-prim',
      '<primitive> ::= "*" => mult-prim',
    ].join('\n')
    await setGrammarInput(page, grammar)

    await expect.poll(() => readGrammarPreview(page), { timeout: 5000 })
      .toContain('(expression (primitive "(" (separated-list expression ",") ")") primapp-exp)')
    expect(await readGrammarError(page)).toBeNull()
  })

  test('caso 41: (separated-list <expression>) sin separador se rechaza con mensaje claro', async ({ page }) => {
    const grammar = [
      '<program> ::= <expression> => a-program',
      '<expression> ::= <number> => lit-exp',
      '<expression> ::= <identifier> => var-exp',
      '<expression> ::= <primitive> "(" (separated-list <expression>) ")" => primapp-exp',
      '<primitive> ::= "+" => add-prim',
      '<primitive> ::= "*" => mult-prim',
    ].join('\n')
    await setGrammarInput(page, grammar)

    await expect.poll(() => readGrammarError(page), { timeout: 5000 }).toBeTruthy()
    const message = await readGrammarError(page)
    expect(message).toContain('separador de separated-list')

    const generar = page.getByRole('button', { name: 'Generar archivos' })
    await expect(generar).toBeDisabled()
  })

  test('caso 44: notación literal (arbno ...) se traduce a (arbno ...) sin error "illegal item arbno"', async ({ page }) => {
    const grammar = [
      '<program> ::= <expression> => a-program',
      '<expression> ::= <number> => lit-exp',
      '<expression> ::= <identifier> => var-exp',
      '<expression> ::= <primitive> "(" (separated-list <expression> ",") ")" => primapp-exp',
      '<expression> ::= "begin" <expression> (arbno ";" <expression>) "end" => begin-exp',
      '<primitive> ::= "+" => add-prim',
      '<primitive> ::= "*" => mult-prim',
    ].join('\n')
    await setGrammarInput(page, grammar)

    await expect.poll(() => readGrammarPreview(page), { timeout: 5000 })
      .toContain('(arbno ";" expression)')
    expect(await readGrammarError(page)).toBeNull()
  })

  test.afterEach(async ({ page }) => {
    await closeGrammarModal(page).catch(() => {})
  })
})

test.describe('Intérpretes del curso escritos a mano (casos 42-43)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const empezar = page.getByRole('button', { name: '¡Empezar!' })
    if (await empezar.isVisible().catch(() => false)) await empezar.click()
  })

  test('caso 42: init-env definido en main.rkt (no en environment.rkt) ya no rompe con "unbound identifier"', async ({ page }) => {
    const originalEnv = readCurso('environment.rkt')
    const originalMain = readCurso('main.rkt')

    const envWithoutInitEnv = originalEnv.replace(
      "\n;; Ambiente inicial del curso: sus dos marcos, [x y z] y [a b c], van en uno.\n(define init-env\n  (lambda ()\n    (extend-env '(x y z a b c) '(1 2 3 4 5 6) (empty-env))))\n",
      '\n',
    )
    expect(envWithoutInitEnv).not.toBe(originalEnv)

    const mainWithInitEnv = originalMain.replace(
      '(require "utils.rkt")\n',
      '(require "utils.rkt")\n\n(define init-env\n  (lambda ()\n    (extend-env \'(x y z a b c) \'(1 2 3 4 5 6) (empty-env))))\n',
    )
    expect(mainWithInitEnv).not.toBe(originalMain)

    await selectFileTab(page, 'environment.rkt')
    await setActiveFileContent(page, envWithoutInitEnv)
    await selectFileTab(page, 'main.rkt')
    await setActiveFileContent(page, mainWithInitEnv)
    await selectFileTab(page, 'grammar.rkt')
    await setActiveFileContent(page, readCurso('grammar.rkt'))
    await selectFileTab(page, 'utils.rkt')
    await setActiveFileContent(page, readCurso('utils.rkt'))

    await activateSession(page)
    await submit(page, '+(a, *(b, sub1(c)))')

    await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
    const lines = await readConsoleLines(page)
    expect(lines.at(-1)?.level).not.toBe('error')
    expect(lines.at(-1)?.message).toBe('29')
  })

  test('caso 43: init-env definido como valor (usado sin paréntesis) ya no rompe con "cases: not a environment"', async ({ page }) => {
    const originalEnv = readCurso('environment.rkt')
    const originalMain = readCurso('main.rkt')

    const envWithValueInitEnv = originalEnv.replace(
      "(define init-env\n  (lambda ()\n    (extend-env '(x y z a b c) '(1 2 3 4 5 6) (empty-env))))",
      "(define init-env (extend-env '(x y z a b c) '(1 2 3 4 5 6) (empty-env)))",
    )
    expect(envWithValueInitEnv).not.toBe(originalEnv)

    const mainWithoutParens = originalMain.replace(
      '(evaluar-expresion exp (init-env))',
      '(evaluar-expresion exp init-env)',
    )
    expect(mainWithoutParens).not.toBe(originalMain)

    await selectFileTab(page, 'environment.rkt')
    await setActiveFileContent(page, envWithValueInitEnv)
    await selectFileTab(page, 'main.rkt')
    await setActiveFileContent(page, mainWithoutParens)
    await selectFileTab(page, 'grammar.rkt')
    await setActiveFileContent(page, readCurso('grammar.rkt'))
    await selectFileTab(page, 'utils.rkt')
    await setActiveFileContent(page, readCurso('utils.rkt'))

    await activateSession(page)
    await submit(page, '+(a, *(b, sub1(c)))')

    await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
    const lines = await readConsoleLines(page)
    expect(lines.at(-1)?.level).not.toBe('error')
    expect(lines.at(-1)?.message).toBe('29')
  })
})
