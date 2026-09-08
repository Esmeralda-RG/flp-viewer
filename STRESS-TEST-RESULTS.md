# Pruebas de estrés: capacidad para evaluación en vivo (15-32 estudiantes)

## Contexto y objetivo

Este documento resume las pruebas de carga realizadas sobre flp-viewer para responder una pregunta concreta: ¿qué arquitectura de servidor necesita el proyecto para soportar entre 15 y 32 estudiantes usando la aplicación al mismo tiempo, en el contexto de una evaluación en vivo (por ejemplo, la defensa de la tesis)? No se trataba solo de que la app "no se caiga", sino de que cada estudiante reciba un resultado correcto y en un tiempo razonable, incluso si todos presionan "Ejecutar" casi al mismo momento.

## De dónde viene el problema

Cada vez que un estudiante ejecuta su código, el endpoint `POST /api/run` (`app/api/run/route.ts`) levanta un proceso de Racket completamente nuevo para interpretarlo. Ese proceso no reutiliza nada de una ejecución a otra: no hay bytecode compilado en caché (no se corre `raco make`), así que cada vez se vuelve a expandir por completo tanto `#lang racket` como `#lang eopl` antes de correr una sola línea del programa del estudiante. En la versión original del código, además, no existía ningún límite de cuántas de estas ejecuciones podían correr al mismo tiempo: si diez estudiantes presionaban "Ejecutar" en el mismo minuto, el servidor lanzaba diez procesos de Racket compitiendo por la misma CPU y la misma memoria, sin ningún tipo de orden ni control.

Para que las pruebas fueran representativas del peor caso real, se usó el ejemplo más pesado de los que trae la aplicación (`examples/eopl-template`, el intérprete EOPL "avanzado", con soporte para estructuras, arreglos y pattern matching) junto con un programa que ejercita bucles y estado mutable:

```
var x = 0 in
  begin
    for i from 0 until 10 by 1 do set x = (x + i);
    x
  end
```

Se construyeron dos escenarios de carga con k6 (herramienta de pruebas de estrés), ambos disponibles en la carpeta [`load-test/`](load-test/) del repositorio para que puedan volver a correrse cuando se necesite:

- **Llegadas repartidas** (`eopl-avanzado-load.js`): simula estudiantes que van llegando de forma escalonada, con pausas de 15 a 30 segundos entre cada corrida (como leer el resultado antes de volver a intentar), subiendo gradualmente de 1 a 30 estudiantes concurrentes.
- **Ráfaga** (`eopl-avanzado-burst.js`): simula el momento más exigente de una clase o evaluación en vivo, donde todos los estudiantes presionan "Ejecutar" casi en el mismo segundo, sin ninguna coordinación entre ellos.

Ambos escenarios se corrieron contra distintas configuraciones de hardware simuladas con límites de Docker (`compose.tier-a.yml`, `compose.tier-b.yml`, `compose.tier-c.yml`): 1 vCPU/1GB, 2 vCPU/2GB y 4 vCPU/4GB respectivamente.

## Lo que mostró la primera prueba: la app miente bajo presión

Con la configuración más pequeña (1 vCPU / 1GB) y sin ningún control de concurrencia, el resultado fue preocupante, y no solo por los números de latencia. El percentil 95 de la latencia llegó a 18.7 segundos, muy por encima del umbral de 10 segundos que se había fijado como aceptable, y un 2.09% de las peticiones fallaron directamente a nivel de red. Pero el hallazgo más importante estaba escondido detrás de un dato que a primera vista parecía positivo: la gran mayoría de las respuestas llegaban con código HTTP 200, es decir, "todo salió bien". Al revisar el contenido real de esas respuestas, sin embargo, se encontró que solo un 33% traía un resultado genuino de la ejecución del programa. El otro 67% era, en realidad, un mensaje de "tiempo de ejecución agotado" que el servidor devolvía disfrazado de respuesta exitosa, porque el límite interno de 15 segundos por ejecución se cumplía silenciosamente sin que el código marcara la respuesta como un error de transporte.

Esto es más grave que una simple lentitud: un estudiante viendo esa respuesta pensaría que su programa no compila o tiene un error, cuando en realidad el servidor nunca llegó a terminar de ejecutarlo por falta de CPU disponible. Los datos de monitoreo de recursos confirmaron la causa: a partir de apenas 5 estudiantes ejecutando código al mismo tiempo, el único núcleo de CPU disponible en este nivel quedaba pegado en 100% de uso de forma permanente durante el resto de la prueba, y desde los 10 estudiantes concurrentes en adelante, la memoria del contenedor tocaba repetidamente su techo de 1 GB, señal de que el sistema estaba al borde de quedarse sin memoria.

## La solución: una cola de concurrencia

El diagnóstico llevó a una corrección concreta en el código: se agregó un módulo (`app/lib/run-queue.ts`) que actúa como un semáforo, limitando cuántos procesos de Racket pueden correr al mismo tiempo (configurable con la variable de entorno `RACKET_MAX_CONCURRENCY`, pensada para fijarse según la cantidad de vCPU disponibles) y poniendo en fila de espera al resto de las peticiones en vez de dejarlas competir todas a la vez por el mismo procesador. Un detalle importante descubierto durante la implementación: el número de CPU que Node.js detecta automáticamente dentro de un contenedor (`os.cpus().length`) corresponde a los núcleos físicos de la máquina anfitriona, no al límite que Docker le impone al contenedor, así que ese valor no sirve como referencia automática y hay que fijar `RACKET_MAX_CONCURRENCY` explícitamente para cada configuración de hardware.

Al repetir la prueba de llegadas repartidas sobre la misma configuración mínima (1 vCPU / 1GB) pero ya con la cola activa, el cambio fue notable: el percentil 95 de latencia bajó de 18.7 a 5.23 segundos, y la tasa de error cayó a 0%, tanto a nivel de red como en el contenido de las respuestas — ninguna de las respuestas exitosas resultó ser un error disfrazado. Sorprendentemente, la cantidad de ejecuciones realmente completadas durante los 21 minutos de la prueba también aumentó, de aproximadamente 161 antes a 638 después, porque al no competir por CPU cada ejecución individual terminaba en un par de segundos en lugar de ser interrumpida a los 15 segundos después de haber consumido procesador sin producir ningún resultado útil. Es importante ser honesto sobre lo que este cambio logra y lo que no: la cola no le da más capacidad de cómputo a la máquina, simplemente evita que esa capacidad se desperdicie. Funcionó tan bien en esta prueba porque las llegadas estaban repartidas en el tiempo; ante una ráfaga real de estudiantes llegando todos juntos, la espera en la fila sería mayor.

## La prueba decisiva: la ráfaga de 32 estudiantes

Para acercarse al escenario más realista de una evaluación en vivo — donde es probable que muchos estudiantes ejecuten su código casi al mismo tiempo, por ejemplo justo después de una instrucción del profesor — se corrió el escenario de ráfaga con 32 estudiantes simultáneos sobre dos configuraciones de hardware más generosas que la mínima: 2 vCPU/2GB y 4 vCPU/4GB, ambas ya con la cola de concurrencia activa.

En ambas configuraciones el resultado fue completo: cero errores y cero respuestas falsas, gracias a la cola. La diferencia entre una y otra estuvo en cuánto tiempo tuvo que esperar cada estudiante para ver su resultado. Con 2 vCPU, la latencia promedio fue de 10.1 segundos y el percentil 95 llegó a 15.75 segundos, apenas por encima del límite interno de ejecución de 15 segundos — en la práctica, la mitad de los estudiantes esperaría más de 10 segundos y el más lento del grupo casi 17, algo que en una evaluación en vivo se percibe fácilmente como que la aplicación se quedó colgada, aunque nunca llegue a fallar de verdad. Con 4 vCPU, en cambio, la latencia promedio bajó a 5.9 segundos y el percentil 95 a 10.66 segundos, con la CPU y la memoria del contenedor lejos de su límite (unos 600 MB usados de los 4 GB disponibles). Es decir, duplicar la CPU no solo evitó el margen ajustado de la configuración anterior, sino que redujo la espera prácticamente a la mitad.

## Recomendación final

Para la evaluación con 15 a 32 estudiantes se recomienda desplegar la aplicación en una máquina de **4 vCPU y 4 GB de RAM**, con la variable `RACKET_MAX_CONCURRENCY=4` y la cola de concurrencia ya integrada en el código. Se trata de un evento puntual e importante, y el costo adicional de alquilar una máquina de este tamaño por los pocos días que dure la evaluación es bajo comparado con el riesgo de que la aplicación se sienta lenta o se atasque justo en el momento en que se está evaluando el trabajo.

## Cómo reproducir estas pruebas

```bash
# Escenario de llegadas repartidas, sobre la configuración recomendada
docker compose -f load-test/compose.tier-c.yml -p flp-tier-c up -d --build
docker run --rm -i --network host -v "$(pwd)":/repo -w /repo grafana/k6 run load-test/eopl-avanzado-load.js

# Escenario de ráfaga (32 estudiantes casi simultáneos)
docker run --rm -i --network host -v "$(pwd)":/repo -w /repo \
  -e STUDENTS=32 -e ITER=2 \
  grafana/k6 run load-test/eopl-avanzado-burst.js

docker compose -f load-test/compose.tier-c.yml -p flp-tier-c down
```
