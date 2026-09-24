import { test, expect } from '@playwright/test'
import { CASES } from './fixtures/cases'
import {
  selectExample, activateSession, setStepMode, clearConsole, submit,
  readConsoleLines, readEnvFrames, clickNextStep,
} from './helpers'

test.describe('Pruebas funcionales 1-39', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const empezar = page.getByRole('button', { name: '¡Empezar!' })
    if (await empezar.isVisible().catch(() => false)) await empezar.click()
  })

  for (const c of CASES) {
    test(`caso ${c.id}: ${c.concept}`, async ({ page }) => {
      await selectExample(page, c.exampleId)
      await activateSession(page)
      await setStepMode(page, c.steps.length > 1)
      await clearConsole(page)
      await submit(page, c.input)

      for (let i = 0; i < c.steps.length; i++) {
        const step = c.steps[i]
        const expectedLineCount = i + 2 // 1 eco de entrada + (i+1) salidas mostradas hasta ahora
        await expect(page.locator('[data-testid="console-line"]')).toHaveCount(expectedLineCount, { timeout: 20_000 })

        const lines = await readConsoleLines(page)
        const last = lines.at(-1)!

        if (step.errorContains !== undefined) {
          expect(last.level).toBe('error')
          if (step.errorContains) expect(last.message).toContain(step.errorContains)
        } else {
          expect(last.level).not.toBe('error')
          expect(last.message).toBe(step.output)
        }

        const frames = await readEnvFrames(page)
        expect(frames.map((f) => f.label)).toEqual(step.environments.map((e) => e.label))
        for (let f = 0; f < step.environments.length; f++) {
          expect(frames[f].bindings).toEqual(step.environments[f].bindings)
        }

        if (i < c.steps.length - 1) await clickNextStep(page)
      }
    })
  }
})
