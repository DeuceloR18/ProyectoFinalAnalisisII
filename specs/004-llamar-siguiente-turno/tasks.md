# Tareas: Llamar siguiente turno (SPEC-04)

**Entrada**: documentos de diseño en `specs/004-llamar-siguiente-turno/`.

**Base de diseño**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md) y [quickstart.md](./quickstart.md).

**Responsables**:

- Domain y Application: Persona 2.
- Infrastructure, base de datos y API: Persona 3.
- Interfaz web y UX: Persona 4.

**Dependencias externas — deben completarse en sus especificaciones originales**:

- Estructura de solución, proyectos, proyectos de prueba, base de datos, conexión y host: `specs/001-registrar-servicios/tasks.md`, T001-T007.
- Contrato y repositorio de servicios, y API de listado para selección: SPEC-01 T010, T014 y T030.
- Tablas/columnas de turnos, contador y fixture SQL Server: `specs/002-generar-turno/tasks.md`, T001-T003.
- Caso de uso y repositorio de generación, API y pantalla de generación para preparar turnos: SPEC-02 T007 y T011-T013.
- Fila de espera y endpoint/UI de consulta para verificar que el turno llamado deja la fila: `specs/003-consultar-fila-espera/tasks.md`, T008-T013.
- Las pruebas deben usar servicios y turnos creados mediante los flujos de SPEC-01/SPEC-02, o fixtures aislados. No se repiten aquí las tareas de registrar servicios, generar turnos ni consultar la fila.
- Los identificadores de tareas se reinician en cada SPEC; toda dependencia externa incluye su ruta para evitar ambigüedad.

**Evidencia**: Guardar resultados automatizados `.trx`, capturas y notas en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-XX/` y `evidence/CE-XXX/`. Las pruebas SQL deben usar una base aislada y datos ficticios.

## Fase 1: Preparación

La solución, los proyectos por capas, la conexión SQL Server/Dapper, el host Web y las convenciones xUnit se reutilizan de SPEC-01. No se inicializan proyectos ni infraestructura común.

## Fase 2: Fundamentos de persistencia

**Propósito**: Preparar el cambio de esquema y las pruebas SQL Server, que bloquean las historias.

### Infrastructure y base de datos — responsable: Persona 3

- [ ] T001 Crear `src/Servicio.Infrastructure/Database/004-llamar-turno.sql` para agregar `FechaHoraLlamado DATETIMEOFFSET(7) NULL` a `dbo.Turnos` y crear el índice único filtrado `UX_Turnos_UnSoloEnAtencionPorServicio` sobre `ServicioId` con filtro `Estado = 'En atención'`; el cambio no debe alterar los turnos existentes. **Criterios habilitados**: RF04-AT-01, RF04-AT-03, RF04-AT-05 a RF04-AT-07 y RF04-AT-10; CE-002, CE-003 y CE-005. **Depende de**: `specs/002-generar-turno/tasks.md` T001-T002.
- [ ] T002 Crear o ampliar `tests/Servicio.Web.Tests/Infrastructure/LlamarTurnoSqlServerFixture.cs` para usar únicamente `SPEC02_SQLSERVER_CONNECTION`, crear datos aislados de servicios/turnos y limpiar solo los datos creados por cada prueba; verificar que el esquema de SPEC-04 esté aplicado y el índice único filtrado exista. **Criterios habilitados**: RF04-AT-01 a RF04-AT-07, RF04-AT-09 y RF04-AT-10; CE-001 a CE-005. **Depende de**: T001, `specs/001-registrar-servicios/tasks.md` T003/T005/T007 y `specs/002-generar-turno/tasks.md` T003.

## Fase 3: Historia de usuario 1 — Llamar al siguiente turno (Prioridad: P1)

**Objetivo**: Seleccionar automáticamente el turno elegible más antiguo del servicio/día, cambiarlo a atención y reflejar el cambio en la fila.

**Prueba independiente**: En un servicio con dos o más turnos elegibles y ninguno activo, llamar al siguiente y verificar que el más antiguo pasa a «En atención», se registra la hora y el siguiente queda al inicio de la fila.

### Domain y Application — responsable: Persona 2

- [ ] T003 [P] [US1] Crear `tests/Servicio.Domain.Tests/TurnoLlamadoTests.cs` con pruebas para permitir únicamente la transición `Esperando` → `En atención`, asignar `FechaHoraLlamado` y rechazar cualquier otro estado origen sin mutar el turno; guardar el `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/domain.trx`. **Criterio**: RF04-AT-01; apoya CE-001. **Depende de**: `specs/001-registrar-servicios/tasks.md` T003 y `specs/002-generar-turno/tasks.md` T003.
- [ ] T004 [P] [US1] Crear `tests/Servicio.Application.Tests/LlamarSiguienteTurnoTests.cs` para verificar que el caso de uso solicita el llamado por servicio sin aceptar un `TurnoId`, devuelve el turno confirmado y diferencia servicio inexistente, sin espera y atención activa; guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/application.trx` y `RF04-AT-09/application.trx` a `RF04-AT-10/application.trx`. **Criterios**: RF04-AT-01, RF04-AT-09 y RF04-AT-10. **Depende de**: `specs/001-registrar-servicios/tasks.md` T003/T010 y `specs/002-generar-turno/tasks.md` T007.
- [ ] T005 [US1] Implementar en `src/Servicio.Domain/Turno.cs` la propiedad nullable `FechaHoraLlamado` y operación de transición que solo acepte estado `Esperando`, establezca estado `En atención` y registre la marca recibida; rechazar otros estados sin mutar datos y no agregar transición de salida. **Criterio**: RF04-AT-01; apoya CE-001. **Depende de**: T003.
- [ ] T006 [US1] Definir en `src/Servicio.Application/Turnos/ILlamarSiguienteTurnoRepository.cs` y `src/Servicio.Application/Turnos/LlamarSiguienteTurno.cs` el contrato y caso de uso que reciben solo `ServicioId`, devuelven resultados diferenciados de éxito/servicio inexistente/sin espera/activo, y dejan la selección atómica del turno al repositorio; no aceptar datos de llamado suministrados por Web. **Criterios**: RF04-AT-01, RF04-AT-03, RF04-AT-09 y RF04-AT-10. **Depende de**: T004-T005 y `specs/001-registrar-servicios/tasks.md` T010.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T007 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/SqlServerLlamadoOrdenYServicioTests.cs` para preparar dos servicios y varios turnos; comprobar que se llama al más antiguo por `FechaHoraGeneracion` y `Correlativo`, solo cambia el servicio objetivo y los otros turnos quedan intactos. Guardar resultados en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/sql.trx`, `RF04-AT-02/sql.trx` y `RF04-AT-03/sql.trx`. **Criterios**: RF04-AT-01 a RF04-AT-03. **Depende de**: T002 y `specs/002-generar-turno/tasks.md` T001-T003.
- [ ] T008 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/LlamadosSimultaneosMismoServicioTests.cs` para enviar dos llamados simultáneos al mismo servicio con varios turnos esperando y comprobar que exactamente uno se confirma, el otro recibe conflicto por turno activo, ningún turno se llama dos veces y nunca hay dos filas «En atención»; verificar además el índice único filtrado en SQL Server y guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/concurrencia.trx`, `RF04-AT-10/concurrencia.trx` y `CE-002/concurrencia.trx`. **Criterios**: RF04-AT-01 y RF04-AT-10; CE-002. **Depende de**: T002 y `specs/002-generar-turno/tasks.md` T003.
- [ ] T009 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/LlamarSiguienteTurnoApiTests.cs` para verificar `POST /api/servicios/{servicioId}/turnos/llamar-siguiente`, respuesta `200`, identificadores, número, estado y `fechaHoraLlamado`; conservar resultado en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/api.trx`. **Criterio**: RF04-AT-01; apoya CE-001. **Depende de**: T002, `specs/001-registrar-servicios/tasks.md` T007 y `specs/002-generar-turno/tasks.md` T003.
- [ ] T010 [US1] Implementar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` el llamado atómico con Dapper: en una transacción adquirir `sp_getapplock` exclusivo por `ServicioId`, comprobar turno activo en cualquier fecha, tomar hora local SQL Server, seleccionar el candidato del día en `Esperando` por fecha/hora y correlativo, aplicar la transición Domain y actualizar condicionalmente estado/fecha; manejar no espera y activo sin escrituras. **Criterios**: RF04-AT-01 a RF04-AT-03 y RF04-AT-09 a RF04-AT-10; CE-001, CE-002 y CE-004. **Depende de**: T001, T005-T008 y `specs/002-generar-turno/tasks.md` T011.
- [ ] T011 [US1] Implementar en `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` el `POST /api/servicios/{servicioId}/turnos/llamar-siguiente`, sin cuerpo ni ID de turno, conectado al caso de uso; responder `200` solo tras confirmar, `404` para servicio inexistente y `409` con códigos/mensajes diferentes para sin espera y turno activo; los errores técnicos no deben presentarse como rechazos de negocio. **Criterios**: RF04-AT-01, RF04-AT-09 y RF04-AT-10. **Depende de**: T006, T010 y `specs/001-registrar-servicios/tasks.md` T006.

### Interfaz web y UX — responsable: Persona 4

- [ ] T012 [US1] Crear `src/Servicio.Web/Pages/Turnos/Llamar.cshtml` y `src/Servicio.Web/wwwroot/js/llamar-turno.js` para seleccionar servicio con `GET /api/servicios`, solicitar llamado sin permitir elegir un número, presentar el turno llamado, mensajes claros y controles accesibles por teclado; si falta selección, pedirla y no enviar el POST. **Criterios**: RF04-AT-01 y RF04-AT-08. **Depende de**: T011 y `specs/001-registrar-servicios/tasks.md` T030/T034.
- [ ] T013 [P] [US1] Ejecutar aceptación manual de RF04-AT-01 con al menos dos turnos elegibles; llamar siguiente, verificar turno más antiguo, estado y hora de llamado, y guardar captura/resultado en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-01/interfaz.png` y `resultado.md`. **Criterio**: RF04-AT-01; apoya CE-001. **Depende de**: T012 y T007.
- [ ] T014 [P] [US1] Ejecutar aceptación manual de RF04-AT-02 y RF04-AT-03: llamar cuando C-001 precede a C-002 y repetir con dos servicios, comprobando que C-002 queda primero y el otro servicio no cambia; guardar capturas y notas en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-02/` y `RF04-AT-03/`. **Criterios**: RF04-AT-02 y RF04-AT-03. **Depende de**: T012 y T007.
- [ ] T015 [P] [US1] Ejecutar aceptación manual de RF04-AT-04: guardar la fila de SPEC-03 antes y después de llamar, comprobar que el turno activo desaparece y el total disminuye en uno; guardar capturas/resultados en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-04/`. **Criterio**: RF04-AT-04. **Depende de**: T012 y `specs/003-consultar-fila-espera/tasks.md` T008-T013.

## Fase 4: Historia de usuario 2 — Consultar turno actual por servicio (Prioridad: P1)

**Objetivo**: Mostrar el número actualmente en atención del servicio elegido, persistido entre reinicios, o «Ninguno» si no existe.

**Prueba independiente**: Consultar un servicio con activo y otro sin activo; comprobar número o «Ninguno», y repetir tras recrear el host para verificar persistencia.

### Domain y Application — responsable: Persona 2

- [ ] T016 [P] [US2] Ampliar `tests/Servicio.Application.Tests/ConsultarTurnoActualTests.cs` para comprobar que el caso de uso devuelve el único turno activo o resultado vacío y que no muta entidades; guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-05/application.trx` y `RF04-AT-06/application.trx`. **Criterios**: RF04-AT-05 y RF04-AT-06. **Depende de**: T006.
- [ ] T017 [US2] Implementar `src/Servicio.Application/Turnos/ConsultarTurnoActual.cs` y su contrato de lectura por `ServicioId`, devolviendo turno activo o ausencia sin filtrar por día y sin mutar datos. **Criterios**: RF04-AT-05 a RF04-AT-07. **Depende de**: T016.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T018 [P] [US2] Crear `tests/Servicio.Web.Tests/Api/ConsultarTurnoActualApiTests.cs` para verificar `GET /api/servicios/{servicioId}/turno-actual` con activo y sin activo (`turnoActual: null`); guardar resultados en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-05/api.trx` y `RF04-AT-06/api.trx`. **Criterios**: RF04-AT-05 y RF04-AT-06. **Depende de**: T002 y T011.
- [ ] T019 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/TurnoActualPersistidoTrasReinicioTests.cs` para llamar un turno, crear una nueva instancia del host y consultar que el mismo turno sigue `En atención` con `FechaHoraLlamado` conservada; guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-07/persistencia.trx`. **Criterio**: RF04-AT-07; apoya CE-003 y CE-005. **Depende de**: T002 y T010.
- [ ] T020 [US2] Implementar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` la consulta Dapper del turno con `ServicioId` y estado `En atención` para cualquier fecha; devolver ausencia si no existe y no ejecutar escrituras. **Criterios**: RF04-AT-05 a RF04-AT-07. **Depende de**: T001, T017 y T010.
- [ ] T021 [US2] Implementar en `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` `GET /api/servicios/{servicioId}/turno-actual`, respondiendo `200` con turno actual o `turnoActual: null`, y `404` si el servicio no existe. **Criterios**: RF04-AT-05 a RF04-AT-07. **Depende de**: T017, T020 y T011.

### Interfaz web y UX — responsable: Persona 4

- [ ] T022 [US2] Ampliar `src/Servicio.Web/Pages/Turnos/Llamar.cshtml` y `src/Servicio.Web/wwwroot/js/llamar-turno.js` para consultar y mostrar explícitamente el turno actual del servicio seleccionado mediante `GET /api/servicios/{servicioId}/turno-actual`; mostrar número cuando existe y el texto exacto «Ninguno» cuando `turnoActual` es null; no mostrar un valor de otro servicio. **Criterios**: RF04-AT-05 y RF04-AT-06. **Depende de**: T012 y T021.
- [ ] T023 [P] [US2] Ejecutar aceptación manual de RF04-AT-05 y RF04-AT-06 para servicios con activo y sin activo; capturar número y «Ninguno» respectivamente y guardar resultados en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-05/interfaz.png`, `RF04-AT-05/resultado.md`, `RF04-AT-06/interfaz.png` y `RF04-AT-06/resultado.md`. **Criterios**: RF04-AT-05 y RF04-AT-06. **Depende de**: T022 y T018.
- [ ] T024 [P] [US2] Ejecutar aceptación manual de RF04-AT-07: reiniciar el host luego de llamar un turno y comprobar que la interfaz vuelve a mostrar el mismo número activo; guardar captura y verificación en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-07/`. **Criterio**: RF04-AT-07; apoya CE-005. **Depende de**: T022 y T019.

## Fase 5: Historia de usuario 3 — Informar llamadas no permitidas (Prioridad: P1)

**Objetivo**: Informar claramente falta de selección, ausencia de turnos elegibles o atención ya activa, y conservar los datos sin cambios.

**Prueba independiente**: Probar los tres rechazos y comparar estado, fecha de llamado y demás datos antes/después.

### Domain y Application — responsable: Persona 2

- [ ] T025 [P] [US3] Ampliar `tests/Servicio.Application.Tests/LlamarSiguienteTurnoTests.cs` para confirmar que ausencia de espera y turno activo producen resultados distintos y no se solicita transición Domain; guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-09/application.trx` y `RF04-AT-10/application.trx`. **Criterios**: RF04-AT-09 y RF04-AT-10; apoya CE-004. **Depende de**: T006.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T026 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/LlamadoRechazadoSinEsperaTests.cs` para verificar `409`, código `sin_turnos_en_espera`, mensaje exacto y ausencia de cambios en filas/contador cuando no hay turno elegible ni activo; guardar `.trx` y comparación en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-09/`. **Criterio**: RF04-AT-09; apoya CE-004. **Depende de**: T002 y T011.
- [ ] T027 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/LlamadoRechazadoTurnoActivoTests.cs` para preparar un activo incluso de día previo y verificar `409`, código `turno_en_atencion`, mensaje de finalizar la atención y que estado/fecha de llamado de todos los turnos quedan intactos; guardar `.trx` en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-10/`. **Criterio**: RF04-AT-10; apoya CE-002 y CE-004. **Depende de**: T001-T002 y T011.
- [ ] T028 [P] [US3] Crear `tests/Servicio.Web.Tests/Ui/LlamarSiguienteSinSeleccionTests.cs` para comprobar que Web pide seleccionar servicio, no envía `POST` y los datos no cambian; guardar resultado en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-08/pruebas-ui.trx`. **Criterio**: RF04-AT-08; apoya CE-004. **Depende de**: T012.

### Interfaz web y UX — responsable: Persona 4

- [ ] T029 [US3] Actualizar `src/Servicio.Web/wwwroot/js/llamar-turno.js` para comunicar sin selección, sin turnos en espera y turno ya activo mediante sus mensajes/códigos específicos; impedir una llamada sin servicio seleccionado y conservar el turno actual mostrado ante rechazo sin reemplazarlo por datos falsos. **Criterios**: RF04-AT-08 a RF04-AT-10. **Depende de**: T012 y T021.
- [ ] T030 [P] [US3] Ejecutar aceptación manual de RF04-AT-08 sin seleccionar servicio; comprobar mensaje y que no se envía operación ni se cambia el turno actual, y guardar captura/resultado en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-08/interfaz.png` y `resultado.md`. **Criterio**: RF04-AT-08; apoya CE-004. **Depende de**: T029 y T028.
- [ ] T031 [P] [US3] Ejecutar aceptación manual de RF04-AT-09 con fila vacía y de RF04-AT-10 con turno activo; comprobar mensaje correspondiente y que no cambian turnos; guardar capturas y notas en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-09/` y `RF04-AT-10/`. **Criterios**: RF04-AT-09 y RF04-AT-10; apoya CE-004. **Depende de**: T029, T026 y T027.

## Fase 6: Evidencia de criterios de éxito y trazabilidad

**Propósito**: Consolidar resultados medidos y actualizar al final la matriz de aceptación.

### Evidencia por criterios de éxito — responsables de las capas verificadas

- [ ] T032 [P] Consolidar las pruebas de selección de turno más antiguo y transición para CE-001, adjuntando `.trx`, captura de llamada y resultado real en `specs/004-llamar-siguiente-turno/evidence/CE-001/resultado.md`. **Criterio**: CE-001. **Responsables**: Personas 2, 3 y 4. **Depende de**: T003, T007, T009 y T013.
- [ ] T033 [P] Consolidar para CE-002 el resultado del índice único filtrado, dos llamados simultáneos y rechazo sin cambios; consignar que nunca hubo más de un activo por servicio y adjuntar `.trx` en `specs/004-llamar-siguiente-turno/evidence/CE-002/resultado.md`. **Criterio**: CE-002. **Responsable**: Persona 3. **Depende de**: T001, T008 y T027.
- [ ] T034 [P] Consolidar para CE-003 las respuestas del endpoint y la presentación del único turno actual o «Ninguno», con evidencia de RF04-AT-05 a RF04-AT-07 en `specs/004-llamar-siguiente-turno/evidence/CE-003/resultado.md`. **Criterio**: CE-003. **Responsables**: Personas 3 y 4. **Depende de**: T018-T024.
- [ ] T035 [P] Consolidar para CE-004 los mensajes y comparaciones antes/después de los rechazos por falta de selección, ausencia de espera y activo; guardar capturas y `.trx` en `specs/004-llamar-siguiente-turno/evidence/CE-004/resultado.md`. **Criterio**: CE-004. **Responsables**: Personas 2, 3 y 4. **Depende de**: T025-T031.
- [ ] T036 [P] Consolidar para CE-005 el reinicio de host y persistencia de estado/fecha de llamado con `.trx` y comprobación manual en `specs/004-llamar-siguiente-turno/evidence/CE-005/resultado.md`. **Criterio**: CE-005. **Responsables**: Personas 3 y 4. **Depende de**: T019 y T024.
- [ ] T037 [P] Medir para CE-006 el tiempo desde selección del servicio hasta leer el turno actual tras la llamada; registrar duración observada, entorno y captura en `specs/004-llamar-siguiente-turno/evidence/CE-006/resultado.md`. **Criterio**: CE-006. **Responsable**: Persona 4. **Depende de**: T012, T022 y T013.

### Cierre de SPEC-04 — responsables: Personas 2, 3 y 4

- [ ] T038 Actualizar la matriz de criterios de aceptación y pruebas en `specs/004-llamar-siguiente-turno/plan.md` para enlazar RF04-AT-01 a RF04-AT-10 y CE-001 a CE-006 con tareas T003-T037 y sus evidencias; registrar resultados realmente observados y dejar pendientes las pruebas no ejecutadas. **Criterios**: RF04-AT-01 a RF04-AT-10 y CE-001 a CE-006. **Depende de**: T003-T037.

## Dependencias y orden de ejecución

### Dependencias externas

- Antes de SPEC-04 deben estar completos los prerrequisitos indicados de `specs/001-registrar-servicios/tasks.md`: proyectos, SQL Server, repositorio/servicios, host Web y API/listado disponibles.
- Deben estar completos los prerrequisitos de `specs/002-generar-turno/tasks.md`: modelo persistido de turno, generación y fixture de integración para crear turnos de prueba.
- Deben estar disponibles las tareas de consulta de `specs/003-consultar-fila-espera/tasks.md` para verificar que el turno llamado desaparece de la fila y disminuye el total.
- SPEC-04 no vuelve a implementar alta/listado de servicios, generación de turnos ni consulta de fila.

### Dependencias entre fases e historias

- La Fase 2 aplica el esquema y crea la fixture; ambas dependen de SPEC-02.
- US1 depende de la Fase 2 y de los servicios/turnos existentes; implementa la transición y el llamado atómico.
- US2 depende de la transición/persistencia de US1 para verificar el turno activo y su conservación.
- US3 depende del endpoint/pantalla de llamado de US1; usa los resultados del turno actual de US2 para mantener la pantalla coherente tras rechazos.
- T038 es la última tarea; depende de la ejecución y evidencia de las pruebas y aceptaciones anteriores.

### Oportunidades de paralelismo

- T003 y T004 (Domain/Application) y T007-T009 (Infrastructure/API) pueden prepararse en paralelo una vez disponibles las interfaces y fixtures de SPEC-01/02; T010 integra el comportamiento y espera contratos y esquema.
- En US1, T013-T015 pueden ejecutarse en paralelo tras tener UI y datos de prueba aislados.
- En US2, T016, T018 y T019 pueden desarrollarse en paralelo en archivos separados; T020/T021 y la interfaz actual esperan que estén definidos los contratos. T023/T024 son aceptaciones independientes con fixtures distintos.
- En US3, T025-T028 verifican capas/escenarios separados; T030 y T031 se pueden ejecutar en paralelo una vez implementados los mensajes.
- Las consolidaciones T032-T037 son independientes por criterio tras terminar sus pruebas de origen; T038 no puede iniciar hasta que se cierren esas evidencias.
- Las llamadas simultáneas de T008 se ejecutan sobre una base aislada; no paralelizar entre sí otras pruebas que manipulen el mismo servicio de fixture.

## Estrategia de implementación

### MVP recomendado: Historia de usuario 1

1. Completar prerrequisitos de SPEC-01, SPEC-02 y SPEC-03, y la Fase 2 de SPEC-04.
2. Completar US1: transición Domain, operación atómica SQL, endpoint y botón de llamado.
3. Validar RF04-AT-01 a RF04-AT-04 y la prueba de dos llamados simultáneos antes de aceptar el MVP.

### Entrega incremental

1. Agregar US2 para consultar el turno actual, representar «Ninguno» y verificar persistencia tras reinicio.
2. Agregar US3 para rechazos claros y ausencia de cambios en datos.
3. Consolidar CE-001 a CE-006 y actualizar trazabilidad solo con resultados observados.

## Validación del formato

Todas las tareas usan `- [ ]`, identificadores secuenciales desde T001, `[P]` solo para trabajo paralelo, etiqueta `[US1]`, `[US2]` o `[US3]` en fases de historia, rutas de archivo, criterio(s) de aceptación, responsable y dependencias explícitas. Las pruebas especifican la evidencia que deben guardar.
