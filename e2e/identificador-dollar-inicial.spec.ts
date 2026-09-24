import { test, expect } from '@playwright/test'
import { selectExample, activateSession, clearConsole, submit, readConsoleLines } from './helpers'

test('identificador que empieza con $ ya no da error de análisis', async ({ page }) => {
  await page.goto('/')
  const empezar = page.getByRole('button', { name: '¡Empezar!' })
  if (await empezar.isVisible().catch(() => false)) await empezar.click()

  await selectExample(page, 'let-expresiones')
  await activateSession(page)
  await clearConsole(page)
  await submit(page, 'let $a = 4 in -($a, 1)')

  await expect(page.locator('[data-testid="console-line"]')).toHaveCount(2, { timeout: 20_000 })
  const lines = await readConsoleLines(page)
  expect(lines.at(-1)?.level).not.toBe('error')
  expect(lines.at(-1)?.message).toBe('3')
})
