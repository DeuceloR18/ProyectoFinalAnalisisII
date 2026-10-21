# Tareas: Cancelar turno (SPEC-06)

**Entrada**: documentos de diseño en `specs/006-cancelar-turno/`.

**Documentos base**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/openapi.yaml](./contracts/openapi.yaml) y [quickstart.md](./quickstart.md).

**Responsables**:

- Domain y Application: Persona 2.
- Infrastructure, base de datos y API: Persona 3.
- Interfaz web y UX: Persona 4.
- Las pruebas se asignan a la persona responsable de la capa que verifican.

**Prerrequisitos externos — no duplicar en SPEC-06**:

- Proyectos, referencias de capas, conexión y fixture común de SQL Server: `specs/001-registrar-servicios/tasks.md` T001-T007.
- Servicios y selección/listado de servicios existentes: SPEC-01 T010, T014, T030 y T034.
- Tablas `dbo.Turnos`/`dbo.ContadoresTurno`, generación de turnos, contador que nunca retrocede y fixture SQL Server: `specs/002-generar-turno/tasks.md` T001-T003 y T011-T013.
- Fila, filtro por `Esperando`, orden, total y posiciones calculadas: `specs/003-consultar-fila-espera/tasks.md` T008-T013.
- Llamado y bloqueo transaccional compartido por servicio: `specs/004-llamar-siguiente-turno/tasks.md` T001-T002, T010-T011.
- SPEC-04 debe agregar a la petición de llamado la precondición del `TurnoId` esperado para que una llamada simultánea no avance a otro turno cuando la cancelación gane. Esa compatibilidad no está cubierta por las tareas actuales de SPEC-04 y es un prerrequisito externo pendiente; no se implementa en esta carpeta ni se duplica como tarea SPEC-06.
- Estado `Finalizado` y transición de Domain definida por SPEC-05: `specs/005-finalizar-atencion/tasks.md` T001, T005-T006 y T009-T010.
- No se vuelven a implementar servicios, generación, consulta de fila, llamado ni finalización. Las pruebas usan los flujos previos o fixtures aislados.

**Evidencia**: Conservar `.trx`, snapshots antes/después, resultados y capturas en `specs/006-cancelar-turno/evidence/RF06-AT-XX/` y `evidence/CE-XXX/`. Usar datos ficticios y una base SQL Server aislada.

## Fase 1: Preparación

La solución, capas, proyectos, xUnit, API base, conexión SQL Server y generación de turnos se reutilizan de SPEC-01/02. No se crean proyectos ni infraestructura general.

## Fase 2: Fundamentos de persistencia

**Propósito**: Incorporar la marca de cancelación y preparar datos aislados para las historias.

### Infrastructure y base de datos — responsable: Persona 3

- [ ] T001 Crear `src/Servicio.Infrastructure/Database/006-cancelar-turno.sql` para agregar `FechaHoraCancelacion DATETIMEOFFSET(7) NULL` a `dbo.Turnos`; conservar las filas y sus valores existentes, y no borrar ni decrementar el contador `dbo.ContadoresTurno`. **Criterios habilitados**: RF06-AT-01, RF06-AT-05 a RF06-AT-09; CE-001, CE-002, CE-004 y CE-005. **Depende de**: `specs/002-generar-turno/tasks.md` T001-T002, `specs/004-llamar-siguiente-turno/tasks.md` T001 y `specs/005-finalizar-atencion/tasks.md` T001.
- [ ] T002 Crear `tests/Servicio.Web.Tests/Infrastructure/CancelarTurnoSqlServerFixture.cs` usando `SPEC02_SQLSERVER_CONNECTION` para aplicar/verificar el esquema de SPEC-06 y preparar turnos ficticios en `Esperando`, `En atención`, `Finalizado` y `Cancelado`; incluir servicios diferentes y datos C-001/C-002/C-003, aislando y limpiando solo las filas creadas por la prueba. **Criterios habilitados**: RF06-AT-01 a RF06-AT-09; CE-001 a CE-005. **Depende de**: T001, `specs/001-registrar-servicios/tasks.md` T003/T005/T007 y `specs/002-generar-turno/tasks.md` T003.

## Fase 3: Historia de usuario 1 — Cancelar un turno en espera con confirmación (Prioridad: P2)

**Objetivo**: Mostrar confirmación identificada por número, cancelar solo tras confirmación y actualizar fila, total y posiciones sin alterar el orden relativo.

**Prueba independiente**: Con C-001, C-002 y C-003 en espera, cancelar C-002 confirmando; comprobar estado/marca, mensaje y fila C-001 posición 1 y C-003 posición 2. Repetir rechazando el diálogo y comprobar que no se envió la API ni cambió ningún dato.

### Domain y Application — responsable: Persona 2

- [ ] T003 [P] [US1] Crear `tests/Servicio.Domain.Tests/TurnoCancelacionTests.cs` para verificar que solo `Esperando` permite la transición a `Cancelado`, asigna `FechaHoraCancelacion` y conserva todos los demás campos; guardar el `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-01/domain.trx` y `RF06-AT-07/domain.trx`. **Criterios**: RF06-AT-01 y RF06-AT-07; CE-001 y CE-002. **Depende de**: `specs/001-registrar-servicios/tasks.md` T003 y `specs/002-generar-turno/tasks.md` T003.
- [ ] T004 [P] [US1] Crear `tests/Servicio.Application.Tests/CancelarTurnoTests.cs` para comprobar que `CancelarTurno` recibe solo `TurnoId`, devuelve el resultado cancelado o el resultado de estado no permitido y no acepta estado, marca temporal o confirmación provenientes del cliente; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-01/application.trx` y `RF06-AT-07/application.trx`. **Criterios**: RF06-AT-01 y RF06-AT-07. **Depende de**: `specs/001-registrar-servicios/tasks.md` T010.
- [ ] T005 [US1] Extender `src/Servicio.Domain/Turno.cs` con `FechaHoraCancelacion` nullable y una operación que acepte únicamente `Esperando` → `Cancelado`; en los demás estados debe rechazar sin alterar estado, número, servicio, nombre ni fechas existentes. **Criterios**: RF06-AT-01, RF06-AT-06 y RF06-AT-07; CE-001 y CE-002. **Depende de**: T003 y `specs/004-llamar-siguiente-turno/tasks.md` T005.
- [ ] T006 [US1] Crear `src/Servicio.Application/Turnos/ICancelarTurnoRepository.cs` y `src/Servicio.Application/Turnos/CancelarTurno.cs` para declarar la operación por `TurnoId` ya confirmada y resultados diferenciados de éxito, turno inexistente, ya cancelado y estado no cancelable; la confirmación y la hora no son datos del request. **Criterios**: RF06-AT-01, RF06-AT-04 y RF06-AT-07 a RF06-AT-09. **Depende de**: T004-T005.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T007 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/FilaTrasCancelarTests.cs` para cancelar C-002 entre C-001/C-003 y consultar `GET /api/servicios/{servicioId}/fila-espera`; comprobar que C-002 desaparece, el total disminuye en uno, C-001 conserva posición 1 y C-003 queda en posición 2; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-03/fila.trx` y `RF06-AT-04/orden.trx`. **Criterios**: RF06-AT-03 y RF06-AT-04; CE-003. **Depende de**: T002 y `specs/003-consultar-fila-espera/tasks.md` T008-T013.
- [ ] T008 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/CancelarTurnoApiTests.cs` para verificar `POST /api/turnos/{turnoId}/cancelar` sin cuerpo, respuesta `200`, mismo número/servicio, estado `Cancelado` y `fechaHoraCancelacion`; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-01/api.trx`. **Criterio**: RF06-AT-01; CE-001. **Depende de**: T002 y `specs/001-registrar-servicios/tasks.md` T007.
- [ ] T009 [US1] Implementar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` la cancelación Dapper dentro de transacción: obtener el servicio del turno, adquirir el mismo bloqueo exclusivo transaccional por servicio usado por SPEC-04/05, volver a leer el registro bajo el bloqueo, capturar `SYSDATETIMEOFFSET()` y actualizar condicionalmente solo si `Estado = 'Esperando'`; cambiar estado/marca juntos y confirmar únicamente si se modificó exactamente una fila, sin modificar contador ni otros campos. **Criterios**: RF06-AT-01, RF06-AT-04 a RF06-AT-09; CE-001, CE-002 y CE-004. **Depende de**: T001, T005-T007 y `specs/004-llamar-siguiente-turno/tasks.md` T010.
- [ ] T010 [US1] Implementar en `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` `POST /api/turnos/{turnoId}/cancelar` sin cuerpo; devolver `200` solo tras el commit, `404 turno_no_encontrado` para identificador inexistente y `409` con códigos distintos para ya cancelado y estado no cancelable; no tratar fallos técnicos como rechazos de negocio. **Criterios**: RF06-AT-01, RF06-AT-05 a RF06-AT-08. **Depende de**: T006, T009 y `specs/001-registrar-servicios/tasks.md` T006.

### Interfaz web y UX — responsable: Persona 4

- [ ] T011 [US1] Ampliar `src/Servicio.Web/Pages/FilaEspera/Index.cshtml` y `src/Servicio.Web/wwwroot/js/fila-espera.js` para agregar botón «Cancelar» en cada turno elegible; al pulsarlo, mostrar diálogo accesible que identifique el número exacto (por ejemplo, C-003) y ofrezca confirmar o cancelar/cerrar; emitir el POST únicamente al confirmar, y tras éxito mostrar mensaje y volver a consultar la fila para actualizar total/posiciones. **Criterios**: RF06-AT-01 a RF06-AT-04; CE-001 a CE-003 y CE-006. **Depende de**: T010, `specs/001-registrar-servicios/tasks.md` T030/T034 y `specs/003-consultar-fila-espera/tasks.md` T010/T021.
- [ ] T012 [P] [US1] Crear `tests/Servicio.Web.Tests/Ui/CancelarSinConfirmarTests.cs` para verificar que cerrar/rechazar el diálogo no envía `POST /api/turnos/{turnoId}/cancelar`, no cambia la fila ni ningún dato del turno y mantiene el mismo número en espera; guardar `.trx` y comparación en `specs/006-cancelar-turno/evidence/RF06-AT-02/ui.trx`. **Criterio**: RF06-AT-02; CE-002. **Depende de**: T011.
- [ ] T013 [P] [US1] Ejecutar aceptación manual de RF06-AT-01 y RF06-AT-02: capturar diálogo con número, confirmación y mensaje final; en una segunda ejecución cerrar el diálogo y comprobar que el turno continúa intacto sin petición; guardar capturas/notas en `specs/006-cancelar-turno/evidence/RF06-AT-01/` y `RF06-AT-02/`. **Criterios**: RF06-AT-01 y RF06-AT-02; CE-001, CE-002 y CE-006. **Depende de**: T011, T008 y T012.
- [ ] T014 [P] [US1] Ejecutar aceptación manual de RF06-AT-03 y RF06-AT-04 con C-001/C-002/C-003; cancelar C-002, actualizar la fila y guardar capturas con total, orden y posiciones consecutivas en `specs/006-cancelar-turno/evidence/RF06-AT-03/` y `RF06-AT-04/`. **Criterios**: RF06-AT-03 y RF06-AT-04; CE-003. **Depende de**: T011 y T007.

## Fase 4: Historia de usuario 2 — Conservar el registro y el número del turno cancelado (Prioridad: P2)

**Objetivo**: Mantener el turno cancelado como registro persistente y asegurar que el correlativo emitido no se reutilice.

**Prueba independiente**: Cancelar un número existente, generar otro turno del mismo servicio/día, reiniciar el host y verificar que el nuevo número avanza y el registro original sigue `Cancelado`.

### Domain y Application — responsable: Persona 2

- [ ] T015 [P] [US2] Ampliar `tests/Servicio.Application.Tests/CancelarTurnoTests.cs` para verificar que el resultado exitoso representa el mismo turno/número/servicio y no solicita modificar el contador ni crea una identidad nueva; conservar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-05/application.trx` y `RF06-AT-06/application.trx`. **Criterios**: RF06-AT-05 y RF06-AT-06; CE-004 y CE-005. **Depende de**: T006.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T016 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/NumeroCanceladoNoReutilizadoTests.cs` para generar C-001/C-002, cancelar C-002 y solicitar otro turno mediante el flujo existente de SPEC-02; verificar que se asigna el siguiente correlativo, el contador no retrocede y el registro C-002 sigue `Cancelado`; guardar `.trx` y consultas comparativas en `specs/006-cancelar-turno/evidence/RF06-AT-05/numero-no-reutilizado.trx`. **Criterio**: RF06-AT-05; CE-004. **Depende de**: T002, T009 y `specs/002-generar-turno/tasks.md` T002/T011-T013.
- [ ] T017 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/TurnoCanceladoPersistidoTests.cs` para cancelar un turno, recrear el host y leerlo mediante el repositorio/SQL Server; comprobar `TurnoId`, servicio, número, estado `Cancelado`, `FechaHoraCancelacion` y conservación de nombre/fechas previas; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-06/persistencia.trx`. **Criterio**: RF06-AT-06; CE-005. **Depende de**: T002 y T009.
- [ ] T018 [US2] Completar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` la proyección de éxito para devolver el registro existente, incluidos `NumeroTurno`, `ServicioId`, datos previos y `FechaHoraCancelacion`, sin ejecutar `DELETE` ni actualizar `dbo.ContadoresTurno`; comprobar compatibilidad con el contrato de T008. **Criterios**: RF06-AT-05 y RF06-AT-06; CE-004 y CE-005. **Depende de**: T009 y T016-T017.

### Interfaz web y UX — responsable: Persona 4

- [ ] T019 [P] [US2] Ejecutar aceptación manual de RF06-AT-05 y RF06-AT-06 con el flujo de prueba: después de cancelar, generar un turno posterior y reiniciar el host; adjuntar evidencia de los números distintos y del registro original persistido en `specs/006-cancelar-turno/evidence/RF06-AT-05/` y `RF06-AT-06/`. **Criterios**: RF06-AT-05 y RF06-AT-06; CE-004 y CE-005. **Depende de**: T011, T016 y T017.

## Fase 5: Historia de usuario 3 — Rechazar cancelaciones no permitidas (Prioridad: P2)

**Objetivo**: Explicar los estados no cancelables y volver a validar que el turno siga esperando después de la confirmación; coordinar correctamente la carrera con SPEC-04.

**Prueba independiente**: Rechazar turnos activos, finalizados y ya cancelados; abrir diálogo para un turno esperando, cambiar su estado antes de confirmar y verificar que el turno conserva el nuevo estado. Ejecutar además cancelación y llamado simultáneos al mismo turno esperado.

### Domain y Application — responsable: Persona 2

- [ ] T020 [P] [US3] Ampliar `tests/Servicio.Domain.Tests/TurnoCancelacionTests.cs` para probar expresamente que `En atención`, `Finalizado` y `Cancelado` no admiten `Cancelar`, y que la operación no muta ninguna propiedad ni reemplaza una marca de cancelación ya existente; guardar `.trx` y snapshots en `specs/006-cancelar-turno/evidence/RF06-AT-07/domain.trx` y `RF06-AT-08/domain.trx`. **Criterios**: RF06-AT-07 y RF06-AT-08; CE-002. **Depende de**: T005.
- [ ] T021 [P] [US3] Ampliar `tests/Servicio.Application.Tests/CancelarTurnoTests.cs` para verificar resultados diferenciados de `turno_ya_cancelado` y `turno_no_esperando`, y que no hay éxito ni nueva escritura ante estado obsoleto; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-07/application.trx`, `RF06-AT-08/application.trx` y `RF06-AT-09/application.trx`. **Criterios**: RF06-AT-07 a RF06-AT-09; CE-002. **Depende de**: T006.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T022 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/CancelarEstadoNoPermitidoTests.cs` para verificar con SQL Server `409 turno_no_esperando` ante `En atención` y `Finalizado`, `409 turno_ya_cancelado` ante `Cancelado`, y comparar todas las columnas antes/después; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-07/` y `RF06-AT-08/`. **Criterios**: RF06-AT-07 y RF06-AT-08; CE-002. **Depende de**: T002, T009 y T010.
- [ ] T023 [P] [US3] Crear `tests/Servicio.Web.Tests/Infrastructure/CancelarTrasCambioDeEstadoTests.cs` para abrir el escenario de confirmación con un turno `Esperando`, cambiarlo a `En atención` por el endpoint real de SPEC-04 antes de enviar el POST de cancelación y comprobar que el POST devuelve conflicto y no altera estado ni marcas de llamado; guardar `.trx` y snapshot en `specs/006-cancelar-turno/evidence/RF06-AT-09/estado-obsoleto.trx`. **Criterio**: RF06-AT-09; CE-002. **Depende de**: T002, T009-T010 y `specs/004-llamar-siguiente-turno/tasks.md` T010-T011.
- [ ] T024 [US3] Actualizar `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` para mapear `turno_no_encontrado` a `404`, `turno_ya_cancelado` y `turno_no_esperando` a `409` con mensajes españoles distintos; no convertir errores técnicos en respuestas de éxito o de estado inválido. **Criterios**: RF06-AT-07 a RF06-AT-09; CE-002. **Depende de**: T010 y T022.
- [ ] T025 [P] [US3] Crear `tests/Servicio.Web.Tests/Infrastructure/CancelarYLLamarSimultaneosTests.cs` con SQL Server real para iniciar simultáneamente cancelación confirmada y llamado condicionado al mismo `TurnoId` esperado; verificar que solo una transición se confirma, la otra recibe conflicto claro, el turno no queda con estados contradictorios y no se llama otro turno en lugar del esperado; guardar `.trx` y resultado en `specs/006-cancelar-turno/evidence/RF06-AT-09/concurrencia.trx`. **Criterio**: RF06-AT-09; CE-002. **Depende de**: T002, T009-T010 y de la precondición de `TurnoId` esperado en SPEC-04 (dependencia externa pendiente; ver sección de prerrequisitos).

### Interfaz web y UX — responsable: Persona 4

- [ ] T026 [US3] Ampliar `src/Servicio.Web/wwwroot/js/fila-espera.js` para conservar el `TurnoId` mostrado en el diálogo, permitir confirmar/cerrar sin peticiones prematuras y presentar el mensaje de conflicto cuando el turno ya no esté en espera; refrescar la fila solo después de un éxito confirmado. **Criterios**: RF06-AT-02, RF06-AT-07, RF06-AT-08 y RF06-AT-09; CE-002 y CE-006. **Depende de**: T011 y T024.
- [ ] T027 [P] [US3] Crear `tests/Servicio.Web.Tests/Ui/ConfirmacionTurnoObsoletoTests.cs` para verificar que, si el turno cambia mientras el diálogo está abierto, la confirmación envía únicamente el ID mostrado, procesa el conflicto y no muestra mensaje de éxito ni altera datos; guardar `.trx` en `specs/006-cancelar-turno/evidence/RF06-AT-09/ui.trx`. **Criterio**: RF06-AT-09; CE-002. **Depende de**: T026.
- [ ] T028 [P] [US3] Ejecutar aceptación manual de RF06-AT-07 a RF06-AT-09 para turnos `En atención`, `Finalizado`, `Cancelado` y turno cambiado mientras el diálogo estaba abierto; guardar mensajes, capturas y comparación de datos en `specs/006-cancelar-turno/evidence/RF06-AT-07/`, `RF06-AT-08/` y `RF06-AT-09/`. **Criterios**: RF06-AT-07, RF06-AT-08 y RF06-AT-09; CE-002. **Depende de**: T024, T026-T027 y T022-T023.

## Fase 6: Evidencia de criterios de éxito y trazabilidad

**Propósito**: Consolidar las pruebas de cada criterio y cerrar la matriz con resultados realmente observados.

### Consolidación de evidencia — responsables de las capas verificadas

- [ ] T029 [P] Consolidar CE-001 con la transición Domain, persistencia SQL/API y confirmación UI de RF06-AT-01; indicar pruebas ejecutadas y resultado observado en `specs/006-cancelar-turno/evidence/CE-001/resultado.md`. **Criterio**: CE-001. **Responsables**: Personas 2, 3 y 4. **Depende de**: T003, T005, T008-T011 y T013.
- [ ] T030 [P] Consolidar CE-002 con no-confirmación, estados inválidos, reintento, estado cambiado y carrera cancelar/llamar; adjuntar snapshots y `.trx` en `specs/006-cancelar-turno/evidence/CE-002/resultado.md`. **Criterio**: CE-002. **Responsables**: Personas 2, 3 y 4. **Depende de**: T012, T020-T028.
- [ ] T031 [P] Consolidar CE-003 con los resultados de RF06-AT-03/04: lista devuelta, totales, orden y posiciones antes/después; guardar evidencia en `specs/006-cancelar-turno/evidence/CE-003/resultado.md`. **Criterio**: CE-003. **Responsables**: Personas 3 y 4. **Depende de**: T007 y T014.
- [ ] T032 [P] Consolidar CE-004 con el contador antes/después, el turno cancelado conservado y el número realmente asignado a la siguiente generación; guardar consultas y `.trx` en `specs/006-cancelar-turno/evidence/CE-004/resultado.md`. **Criterio**: CE-004. **Responsable**: Persona 3. **Depende de**: T016 y T018.
- [ ] T033 [P] Consolidar CE-005 con la comprobación tras reiniciar, incluyendo número, estado, `FechaHoraCancelacion` y columnas previas conservadas; adjuntar `.trx` y snapshot en `specs/006-cancelar-turno/evidence/CE-005/resultado.md`. **Criterio**: CE-005. **Responsables**: Personas 2 y 3. **Depende de**: T015, T017-T019.
- [ ] T034 [P] Medir CE-006 desde identificar el número hasta confirmar o cerrar el diálogo; registrar tiempo real, ruta seguida, resultado y captura en `specs/006-cancelar-turno/evidence/CE-006/resultado.md`. **Criterio**: CE-006. **Responsable**: Persona 4. **Depende de**: T011, T013 y T026.

### Cierre — responsables: Personas 2, 3 y 4

- [ ] T035 Actualizar la matriz de trazabilidad en `specs/006-cancelar-turno/plan.md`, enlazando RF06-AT-01 a RF06-AT-09 y CE-001 a CE-006 con tareas T003-T034 y sus archivos de evidencia; anotar resultados observados y pruebas bloqueadas por la precondición externa de SPEC-04 sin marcarlas como aprobadas. **Criterios**: RF06-AT-01 a RF06-AT-09 y CE-001 a CE-006. **Depende de**: T003-T034.

## Dependencias y ejecución

### Orden de historias

- Fase 2 depende del esquema de SPEC-02 y de la conexión/fixture común de SPEC-01.
- US1 depende de Fase 2 y de la consulta de fila de SPEC-03; proporciona cancelación confirmada y refresco de fila.
- US2 depende del endpoint y persistencia de US1, y consume la generación de SPEC-02 para demostrar no reutilización.
- US3 depende de la operación de US1 y requiere que SPEC-04 soporte la precondición del turno esperado para cerrar la garantía de la carrera.
- T035 es el cierre y debe esperar resultados/evidencias de todas las pruebas.

### Paralelismo

- T003/T004 y T007/T008 pueden prepararse en paralelo en sus capas una vez disponible la fixture T002.
- En US1, la prueba UI de cancelación no confirmada T012 y la prueba de fila T007 trabajan en archivos separados; las aceptaciones manuales T013/T014 pueden ejecutarse por separado con datos aislados.
- En US2, T016 (correlativo) y T017 (reinicio/persistencia) son independientes si usan fixtures separados; T019 se ejecuta después de ambos.
- En US3, las pruebas Domain/Application T020/T021 y las API/infraestructura T022/T023/T025 pueden desarrollarse en paralelo, pero requieren el repositorio/endpoint listos para ejecutarse; T025 queda bloqueada hasta disponer de la precondición de turno esperado en SPEC-04.
- Las consolidaciones T029-T034 son paralelas entre criterios una vez completas sus evidencias. T035 depende de todas.
- Nunca ejecutar en paralelo pruebas que muten el mismo servicio/turno; aislar los fixtures SQL Server por caso.

## Estrategia de implementación

### MVP sugerido: Historia de usuario 1 (P2)

1. Completar prerrequisitos de SPEC-01 a SPEC-05 y Fase 2.
2. Implementar transición, persistencia condicional, endpoint y confirmación UI.
3. Validar RF06-AT-01 a RF06-AT-04 y CE-001 a CE-003 con evidencia.

### Entrega incremental

1. Agregar US2 y comprobar preservación del registro y no reutilización del correlativo.
2. Agregar US3 con rechazos por estado, confirmación obsoleta y prueba concurrente; no aprobar la prueba simultánea hasta integrar la precondición de SPEC-04.
3. Consolidar CE-001 a CE-006 y completar T035 con resultados observados.

## Validación del formato

Todas las tareas usan `- [ ]`, identificadores consecutivos T001-T035, `[P]` solo cuando procede, etiqueta `[US1]`, `[US2]` o `[US3]` en las fases de historia, ruta concreta, responsable, criterio(s), dependencias y evidencia cuando aplica.
