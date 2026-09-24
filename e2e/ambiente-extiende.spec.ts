import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import {
  selectExample, activateSession, clearConsole, submit,
  readEnvFrames, selectFileTab, setActiveFileContent,
} from './helpers'

// Hallazgo #4 de LEEME.md: "El panel no muestra la cadena de ambientes."
// La flecha de "extiende" ahora apunta al ambiente que extend-env realmente
// recibió, no al marco anterior en el arreglo — igual que el profesor lo
// dibuja a mano: un procedimiento aplicado extiende el ambiente donde SE
// CREÓ, y cada llamada recursiva extiende ese mismo ambiente compartido.

// La flecha "extiende" va de padre real (data-from) a hijo (data-to).
async function readExtendsArrows(page: import('@playwright/test').Page) {
  const arrows = page.locator('[data-testid="extends-arrow"]')
  const count = await arrows.count()
  const result: { from: number; to: number }[] = []
  for (let i = 0; i < count; i++) {
    const el = arrows.nth(i)
    result.push({ from: Number(await el.getAttribute('data-from')), to: Number(await el.getAttribute('data-to')) })
  }
  return result
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  const empezar = page.getByRole('button', { name: '¡Empezar!' })
  if (await empezar.isVisible().catch(() => false)) await empezar.click()
})

test('alcance estático: el marco del parámetro salta hasta el ambiente de creación del procedimiento', async ({ page }) => {
  await selectExample(page, 'cierres')
  await activateSession(page)
  await clearConsole(page)
  await submit(page, 'let x = 200 in let f = proc (z) -(z, x) in let x = 100 in (f 1)')

  await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
  const frames = await readEnvFrames(page)
  expect(frames.map((f) => f.label)).toEqual(['empty-env', 'extend', 'extend', 'extend', 'extend'])
  // 0 empty-env, 1 extend{x=200}, 2 extend{f=proc}, 3 extend{x=100} (sombra), 4 extend{z=1} (parámetro de f)
  const arrows = await readExtendsArrows(page)
  // El marco de z (4) extiende el ambiente de creación de f (1), no la x=100 (3).
  expect(arrows).toContainEqual({ from: 1, to: 4 })

  // Al usar columnas por profundidad real, f (2) y z (4) —que comparten el
  // mismo padre (1)— quedan en la misma columna, no una junto a la otra en
  // orden cronológico: x=100 (hijo de f) sí queda una columna más a la derecha.
  const xOf = async (i: number) => {
    const box = await page.locator('[data-testid="env-frame"]').nth(i).boundingBox()
    return box!.x
  }
  expect(Math.abs((await xOf(2)) - (await xOf(4)))).toBeLessThan(1)
  expect(await xOf(3)).toBeGreaterThan(await xOf(2))
})

test('recursión: cada llamada extiende el mismo ambiente de la clausura, no la llamada anterior', async ({ page }) => {
  const CURSO_DIR = path.join(__dirname, '..', 'examples', 'curso-recursivos')
  const readCurso = (name: string) => fs.readFileSync(path.join(CURSO_DIR, name), 'utf8')

  await selectFileTab(page, 'grammar.rkt')
  await setActiveFileContent(page, readCurso('grammar.rkt'))
  await selectFileTab(page, 'environment.rkt')
  await setActiveFileContent(page, readCurso('environment.rkt'))
  await selectFileTab(page, 'main.rkt')
  await setActiveFileContent(page, readCurso('main.rkt'))
  await selectFileTab(page, 'utils.rkt')
  await setActiveFileContent(page, readCurso('utils.rkt'))
  await activateSession(page)
  await clearConsole(page)
  await submit(page, 'letrec fact(x) = if >(x,0) then *(x, (fact sub1(x))) else 1 in (fact 3)')

  await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
  const lines = await page.locator('[data-testid="console-line"]').last().locator('pre').textContent()
  expect(lines).toBe('6')

  const frames = await readEnvFrames(page)
  // 0 empty-env, 1 init-env, 2 extend{fact=closure}, 3..6 extend{x=3..0} — una por llamada recursiva
  expect(frames).toHaveLength(7)
  // Las cuatro llamadas recursivas (3, 4, 5, 6) extienden TODAS el mismo
  // marco (2), donde se creó la clausura de fact — no se encadenan entre sí.
  const arrows = await readExtendsArrows(page)
  expect(arrows.filter((a) => a.from === 2).map((a) => a.to).sort()).toEqual([3, 4, 5, 6])

  // Al ubicarse por columna de profundidad (no cronológicamente), las cuatro
  // quedan apiladas una debajo de otra en la misma columna.
  const xOf = async (i: number) => {
    const box = await page.locator('[data-testid="env-frame"]').nth(i).boundingBox()
    return box!.x
  }
  const xs = await Promise.all([3, 4, 5, 6].map(xOf))
  expect(new Set(xs.map((x) => Math.round(x))).size).toBe(1)
})
