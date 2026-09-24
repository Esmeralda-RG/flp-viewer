import { test, expect } from '@playwright/test'
import {
  selectExample, activateSession, clearConsole, submit,
  readEnvFrames, readAssignTargetArrows,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  const empezar = page.getByRole('button', { name: '¡Empezar!' })
  if (await empezar.isVisible().catch(() => false)) await empezar.click()
})

test('set sobre un parámetro sombreado señala el marco del parámetro, no el de la x externa', async ({ page }) => {
  await selectExample(page, 'cierres-y-estado')
  await activateSession(page)
  await clearConsole(page)
  await submit(page, 'let x = 10 in let f = proc (x) begin set x = 0 ; x end in begin (f 5) ; x end')

  await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
  const frames = await readEnvFrames(page)
  expect(frames.map((f) => f.label)).toEqual(['empty-env', 'extend', 'extend', 'extend', 'asignación'])
  // frames: 0 empty-env, 1 extend{x=10}, 2 extend{f=proc}, 3 extend{x=5} (parámetro), 4 asignación{x=0}
  const arrows = await readAssignTargetArrows(page)
  expect(arrows).toEqual([{ from: 4, to: 3 }])
})

test('set sobre la x externa capturada por un cierre señala esa x, no el parámetro de otra llamada', async ({ page }) => {
  await selectExample(page, 'cierres-y-estado')
  await activateSession(page)
  await clearConsole(page)
  await submit(page, 'let x = 5 in begin let x = 1 in set x = 9 ; x end')

  await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
  const frames = await readEnvFrames(page)
  expect(frames.map((f) => f.label)).toEqual(['empty-env', 'extend', 'extend', 'asignación'])
  // frames: 0 empty-env, 1 extend{x=5}, 2 extend{x=1} (interna), 3 asignación{x=9}
  const arrows = await readAssignTargetArrows(page)
  expect(arrows).toEqual([{ from: 3, to: 2 }])
})
