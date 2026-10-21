# Aceptación de frontend / Frontend acceptance

## Español

Ejecutar desde la raíz con Node.js 20 o posterior y Microsoft Edge instalado:

```sh
npm ci
npm test
```

Alternativa con Chrome instalado, en PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm test`. El servidor de archivos se inicia y cierra automáticamente en un puerto local libre; no iniciar `npm start` para ejecutar las pruebas. Playwright controla un navegador sin interfaz. Cada caso usa una página y fixture independientes. La suite regenera seis capturas en `capturas/`.

### Alcance real

Las pruebas son de interfaz contra una API simulada, definida únicamente en `tests/frontend/fixture.cjs`. La fixture no forma parte de wwwroot ni se sirve al usuario. Verifican solicitudes, representación de datos y errores, actualizaciones, confirmación, bloqueo durante solicitudes y manejo seguro de texto. No prueban reglas reales del backend ni una base de datos; la recarga conserva datos en la fixture del proceso de pruebas, no demuestra persistencia durable.

### Matriz de trazabilidad

| Especificación | Casos automatizados (título en acceptance.test.cjs) | Evidencia | Pendiente de integración real |
| --- | --- | --- | --- |
| SPEC-01 | estado vacío, registro, mayúsculas, duplicado y espacios; recarga | 01-inicio.png | Unicidad y persistencia durable |
| SPEC-02 | selección obligatoria, nombre opcional, número y orden; recarga | 02-fila.png | Reinicio diario, >999, correlativo atómico, timestamps y persistencia |
| SPEC-03 | selección, fila, consulta repetida, exclusión provista por API, cambio de servicio | 02-fila.png | Filtro real día/estado/servicio y desempate |
| SPEC-04 | llamar primero, bloquear segunda llamada, fila vacía, atención de otro día, recarga | 03-atencion.png | Selección FIFO, exclusividad concurrente, llamada y persistencia |
| SPEC-05 | finalizar, Ninguno, no llamar automáticamente, error sin atención | 06-finalizada.png | Estado terminal, timestamps y persistencia |
| SPEC-06 | conservar, Escape, confirmar, renumerar; conflicto de estado | 04-confirmacion.png | Validación atómica, registro cancelado persistente y no reutilización real |
| Transversal | conexión y recuperación; transporte/JSON; texto seguro; bloqueo de solicitud; etiquetas, teclado y móvil | 05-movil.png | Revisión humana, lector de pantalla y otros navegadores |

Las imágenes muestran estados observados; las aserciones ejecutables verifican resultados de acciones. No se presenta una captura previa como evidencia del estado final. Los tiempos de uso de los criterios de éxito requieren prueba humana cronometrada; la duración de automatización no los sustituye.

### Lista de aceptación integrada pendiente

1. Conectar el backend real al contrato de `src/Turnos.Web/README.md` y repetir RF01-RF06 con base vacía.
2. Registrar servicios con espacios, prefijos en minúscula y duplicados; comprobar el rechazo sin cambios.
3. Generar turnos de dos servicios; cambiar la fecha con reloj controlado del backend, superar 999 y probar dos solicitudes concurrentes.
4. Sembrar turnos de otro día/estado/servicio y con timestamp idéntico; comprobar filtro y orden sin modificar datos.
5. Llamar con fila vacía, sin selección y con turno activo de ayer; finalizar únicamente el actual sin alterar otros servicios.
6. Cancelar y rechazar la confirmación; cambiar estado desde otra sesión antes de confirmar; comprobar rechazo sin sobrescribir datos.
7. Reiniciar el proceso y la base de aplicación; verificar conservación de servicios, números, nombres, estados y todas las fechas.
8. Revisión humana del código generado y prueba de uso cronometrada antes de integrar a main.

## English

Run `npm ci` and `npm test` from the repository root with Node.js 20+ and Edge installed. Set PLAYWRIGHT_CHANNEL to chrome to use installed Chrome. The test suite automatically starts/stops a local file server, opens isolated headless browser pages, and regenerates six screenshots.

These are frontend acceptance tests against an isolated API double, not end-to-end tests of a .NET backend or database. They cover the UI scenarios mapped in the table above: service registration/errors, ticket generation, queue/current rendering, calling/completion, cancellation confirmation/conflicts, transport failures, safe text, pending-request locking, keyboard and mobile layout. Reload checks server re-fetching from the fixture, not durable storage.

Real-backend acceptance remains pending for uniqueness, atomic numbering/concurrency, daily reset, values above 999, queue filtering/tie-breaking, terminal states, timestamps, cross-service isolation and durable persistence. The numbered checklist above specifies these integration checks. Human review, screen-reader checks and timed receptionist usability tests remain necessary before main integration. Screenshots illustrate observed states; executable assertions validate action results.
