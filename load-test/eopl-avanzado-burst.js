import http from 'k6/http'
import { check, sleep } from 'k6'

// Simula el peor caso realista: todos los estudiantes presionan "Run" casi
// al mismo segundo (a diferencia de eopl-avanzado-load.js, que reparte las
// llegadas con pausas de 15-30s). Pensado para validar un evento en vivo
// (clase, evaluación) con un número fijo de estudiantes conectados.
//
//   docker run --rm -i --network host \
//     -v "$(pwd)":/repo -w /repo \
//     -e STUDENTS=32 -e ITER=2 \
//     grafana/k6 run load-test/eopl-avanzado-burst.js

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const STUDENTS = Number(__ENV.STUDENTS) || 32
const ITERATIONS = Number(__ENV.ITER) || 2

const files = [
  { name: 'main.rkt', content: open('../examples/eopl-template/main.rkt') },
  { name: 'grammar.rkt', content: open('../examples/eopl-template/grammar.rkt') },
  { name: 'environment.rkt', content: open('../examples/eopl-template/environment.rkt') },
  { name: 'utils.rkt', content: open('../examples/eopl-template/utils.rkt') },
]

const testInput = `var x = 0 in
  begin
    for i from 0 until 10 by 1 do set x = (x + i);
    x
  end`

const payload = JSON.stringify({ files, testInput })
const params = { headers: { 'Content-Type': 'application/json' }, timeout: '30s' }

export const options = {
  scenarios: {
    burst: {
      executor: 'per-vu-iterations',
      vus: STUDENTS,
      iterations: ITERATIONS,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<15000'],
  },
}

export default function () {
  const res = http.post(`${BASE_URL}/api/run`, payload, params)

  check(res, {
    'status 200': (r) => r.status === 200,
    'sin error de racket': (r) => {
      try {
        return JSON.parse(r.body).error === null
      } catch {
        return false
      }
    },
  })

  // Reintento rápido, no una pausa de lectura real: es el caso más agresivo
  sleep(3 + Math.random() * 5)
}
