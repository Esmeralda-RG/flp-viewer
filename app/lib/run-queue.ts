import { cpus } from 'node:os'

// Cada ejecución levanta un proceso Racket completo (sin bytecode cacheado),
// así que dejarlas correr todas a la vez satura CPU/RAM del contenedor bajo
// carga concurrente. Este semáforo limita cuántas corren al mismo tiempo y
// encola el resto en vez de lanzarlas todas de golpe.
const MAX_CONCURRENT_RUNS = Number(process.env.RACKET_MAX_CONCURRENCY) || cpus().length

let active = 0
const queue: Array<() => void> = []

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT_RUNS) {
    active++
    return Promise.resolve()
  }
  return new Promise((resolve) => queue.push(resolve))
}

function release(): void {
  const next = queue.shift()
  if (next) {
    next()
  } else {
    active--
  }
}

export async function withRunSlot<T>(signal: AbortSignal, fn: () => Promise<T>): Promise<T> {
  await acquire()
  try {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    return await fn()
  } finally {
    release()
  }
}
