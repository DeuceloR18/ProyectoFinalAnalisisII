# Turnos.Web · Frontend (SPEC-01 a SPEC-06)

## Español

Interfaz HTML/CSS/JS sin dependencias de producción. Copiar o conservar `wwwroot` en el proyecto ASP.NET Core Web del equipo y servir sus archivos estáticos y documento predeterminado. No se añade una versión de .NET ni un host de backend provisional: el equipo aún debe aportar su solución.

Para inspeccionar la interfaz desde la raíz del repositorio:

```sh
npm start
```

Abrir `http://127.0.0.1:5080`. Este servidor solo sirve archivos; `/api/*` devuelve 503 explicando que falta conectar el backend. No es una aplicación de turnos completa ni guarda información local. Para verificar el flujo con respuestas simuladas, ejecutar `npm test` según `docs/pruebas/README.md`.

### Contrato propuesto de integración

Se propone porque main todavía no tiene endpoints. El integrante de backend debe confirmarlo o ajustar exclusivamente `api.js`/las rutas del adaptador en `app.js` antes de la aceptación integrada. Todos los endpoints usan JSON y el mismo origen; no requieren CORS.

| Método / Ruta | Solicitud | Respuesta 200/201 |
| --- | --- | --- |
| GET `/api/servicios` | - | `[{id,nombre,prefijo}]` |
| POST `/api/servicios` | `{nombre,prefijo}` | `{id,nombre,prefijo}` |
| POST `/api/turnos` | `{servicioId,cliente:null|string}` | Turno |
| GET `/api/servicios/{id}/fila` | - | `{total,turnos:[Turno]}` ya filtrados y ordenados |
| GET `/api/servicios/{id}/actual` | - | Turno o JSON `null` |
| POST `/api/servicios/{id}/llamar` | sin cuerpo | Turno |
| POST `/api/servicios/{id}/finalizar` | sin cuerpo | Turno |
| POST `/api/turnos/{id}/cancelar` | sin cuerpo | Turno |

Identificadores opacos representados como cadenas. Turno: `{id,servicioId,numero,cliente,estado,generadoEn,llamadoEn?,finalizadoEn?,canceladoEn?}`. Fechas ISO 8601 con zona horaria. Estados: `Esperando`, `En atención`, `Finalizado`, `Cancelado`. Se usa Finalizado por los criterios y requisitos de SPEC-05; su introducción menciona Atendido de forma inconsistente.

Errores 400/404/409/500: JSON `{detail:"mensaje comprensible"}` o `{message:"..."}`; se muestra como texto. El servidor debe validar de nuevo todas las acciones, incluidos prefijos duplicados, estado cambiado durante confirmación y atención activa de un día anterior. Debe calcular correlativos, fecha local, orden, exclusiones de la fila, timestamps y persistencia en Domain/Application/Infrastructure. La UI no replica esas reglas ni utiliza localStorage. Un timeout no implica que el servidor no haya procesado la acción: actualizar antes de repetirla.

Archivos: `index.html` estructura, `styles.css` diseño adaptable, `app.js` interacción y renderizado, `api.js` transporte y errores. Nombres y mensajes del servidor se insertan con textContent para evitar interpretar HTML.

## English

Dependency-free HTML/CSS/JS presentation layer. Serve `wwwroot` as static/default files from the team's ASP.NET Core Web project. No provisional .NET version or business backend is introduced. `npm start` serves a visual preview at `http://127.0.0.1:5080`; API requests return a clear 503 until the actual backend is connected. This preview is not a complete persistent queue application.

The table above proposes the same-origin JSON integration contract, pending confirmation by the backend owner. IDs are opaque strings. Ticket fields are `id, servicioId, numero, cliente, estado, generadoEn`, with optional call/completion/cancellation timestamps, using ISO 8601 with timezone. An absent current ticket is JSON null. State names follow the Spanish requirements; Finalizado follows SPEC-05 criteria despite its introduction saying Atendido.

Errors use HTTP 400/404/409/500 and a detail or message field. Domain/Application/Infrastructure must enforce all numbering, ordering, local-day, state, concurrency and persistence rules. The UI renders server results, does not store business data locally, and prevents repeated submissions while pending. After timeout, refresh before repeating an action. Tests use an isolated API double and do not establish backend correctness.
