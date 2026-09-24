import type { Page, Locator } from '@playwright/test'

export async function selectExample(page: Page, exampleId: string) {
  await page.getByRole('button', { name: 'Ejemplos' }).click()
  await page.locator(`[data-testid="example-option"][data-example-id="${exampleId}"]`).click()
}

export async function activateSession(page: Page) {
  const runButton = page.getByRole('button', { name: /Ejecutar/ })
  if (await runButton.isVisible().catch(() => false)) {
    await runButton.click()
  }
  await page.locator('[data-testid="console-input"]').waitFor({ state: 'visible' })
}

export async function setStepMode(page: Page, on: boolean) {
  const button = page.getByRole('button', { name: 'Paso a paso' })
  const pressed = (await button.getAttribute('class'))?.includes('bg-blue-600')
  if (Boolean(pressed) !== on) await button.click()
}

export async function clearConsole(page: Page) {
  await page.getByRole('button', { name: 'limpiar', exact: true }).click()
}

export async function submit(page: Page, text: string) {
  const input = page.locator('[data-testid="console-input"]')
  await input.click()
  await input.fill(text)
  await input.press('Enter')
}

export interface ConsoleLine {
  level: string
  message: string
}

export async function readConsoleLines(page: Page): Promise<ConsoleLine[]> {
  const lines = page.locator('[data-testid="console-line"]')
  const count = await lines.count()
  const result: ConsoleLine[] = []
  for (let i = 0; i < count; i++) {
    const line = lines.nth(i)
    const level = (await line.getAttribute('data-level')) ?? ''
    const message = (await line.locator('pre').textContent()) ?? ''
    result.push({ level, message })
  }
  return result
}

export interface EnvBindingSnapshot {
  name: string
  value: string
}

export interface EnvFrameSnapshot {
  label: string
  bindings: EnvBindingSnapshot[]
}

export async function readEnvFrames(page: Page): Promise<EnvFrameSnapshot[]> {
  const frames = page.locator('[data-testid="env-frame"]')
  const count = await frames.count()
  const result: EnvFrameSnapshot[] = []
  for (let i = 0; i < count; i++) {
    const frameEl = frames.nth(i)
    const label = (await frameEl.getAttribute('data-label')) ?? ''
    const bindingEls = frameEl.locator('[data-testid="env-binding"]')
    const bindingCount = await bindingEls.count()
    const bindings: EnvBindingSnapshot[] = []
    for (let j = 0; j < bindingCount; j++) {
      const bindingEl = bindingEls.nth(j)
      bindings.push({
        name: (await bindingEl.getAttribute('data-name')) ?? '',
        value: (await bindingEl.getAttribute('data-value')) ?? '',
      })
    }
    result.push({ label, bindings })
  }
  return result
}

export interface AssignTargetArrow {
  from: number
  to: number
}

export async function readAssignTargetArrows(page: Page): Promise<AssignTargetArrow[]> {
  const arrows = page.locator('[data-testid="assign-target-arrow"]')
  const count = await arrows.count()
  const result: AssignTargetArrow[] = []
  for (let i = 0; i < count; i++) {
    const el = arrows.nth(i)
    result.push({
      from: Number(await el.getAttribute('data-from')),
      to: Number(await el.getAttribute('data-to')),
    })
  }
  return result
}

export async function clickNextStep(page: Page) {
  await page.getByRole('button', { name: /Siguiente paso/ }).click()
}

// Simular clic + Ctrl+A + pegar por portapapeles resultó no ser confiable:
// cada instancia de Monaco tiene dos nodos "Editor content" (uno real, uno
// espejo oculto de accesibilidad) y cuál queda enfocado tras el clic no es
// determinístico. @monaco-editor/react expone el editor global en
// window.monaco, así que en vez de simular teclado se ubica la instancia
// cuyo nodo DOM está dentro del contenedor dado y se llama setValue
// directamente — dispara el mismo evento onChange que un Ctrl+V real.
async function setMonacoValue(page: Page, container: Locator, content: string) {
  const handle = await container.elementHandle()
  await page.evaluate(
    ({ el, text }) => {
      const monaco = (window as unknown as { monaco?: { editor: { getEditors(): { getDomNode(): Node | null; setValue(v: string): void }[] } } }).monaco
      const editor = monaco?.editor.getEditors().find((e) => {
        const node = e.getDomNode()
        return node !== null && el.contains(node)
      })
      if (!editor) throw new Error('No se encontró la instancia de Monaco dentro del contenedor dado')
      editor.setValue(text)
    },
    { el: handle, text: content },
  )
}

export async function selectFileTab(page: Page, name: string) {
  await page.getByRole('button', { name }).click()
  await page.locator('.monaco-editor:visible').first().waitFor({ state: 'visible' })
}

export async function setActiveFileContent(page: Page, content: string) {
  await setMonacoValue(page, page.locator('.monaco-editor:visible').first(), content)
}

export async function openGrammarModal(page: Page) {
  await page.getByRole('button', { name: 'Gramática' }).click()
  await page.locator('[data-testid="grammar-modal"]').waitFor({ state: 'visible' })
}

export async function closeGrammarModal(page: Page) {
  await page.getByRole('button', { name: 'Cerrar' }).click()
}

export async function setLexInput(page: Page, content: string) {
  await setMonacoValue(page, page.locator('[data-testid="lex-editor"] .monaco-editor'), content)
}

export async function setGrammarInput(page: Page, content: string) {
  await setMonacoValue(page, page.locator('[data-testid="grammar-editor"] .monaco-editor'), content)
}

export async function readGrammarPreview(page: Page): Promise<string> {
  return page.locator('[data-testid="grammar-preview"] > div').allInnerTexts().then((lines) => lines.join('\n'))
}

export async function readGrammarError(page: Page): Promise<string | null> {
  const el = page.locator('[data-testid="grammar-error"]')
  if ((await el.count()) === 0) return null
  return el.textContent()
}

export async function pendingStepsCount(page: Page): Promise<number> {
  const match = page.getByRole('button', { name: /Siguiente paso/ })
  const text = await match.textContent().catch(() => null)
  const m = text?.match(/\((\d+) restante/)
  return m ? Number(m[1]) : 0
}
