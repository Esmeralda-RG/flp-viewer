import http from 'k6/http'
import { check, sleep } from 'k6'

// Ejecutar con Docker (monta el repo completo para que open() encuentre examples/):
//   docker run --rm -i --network host \
//     -v "$(pwd)":/repo -w /repo \
//     grafana/k6 run load-test/eopl-avanzado-load.js
//
// Para apuntar a otro host/puerto: -e BASE_URL=http://localhost:3000

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

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
const params = { headers: { 'Content-Type': 'application/json' }, timeout: '20s' }

export const options = {
  scenarios: {
    students: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1 },
        { duration: '3m', target: 1 },
        { duration: '1m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<10000'],
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

  // Tiempo de lectura/edición de un estudiante entre corridas
  sleep(15 + Math.random() * 15)
}
