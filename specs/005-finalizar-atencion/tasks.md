# Tareas: Finalizar atención (SPEC-05)

**Entrada**: documentos de diseño en `specs/005-finalizar-atencion/`.

**Documentos base**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/openapi.yaml](./contracts/openapi.yaml) y [quickstart.md](./quickstart.md).

**Responsables**:

- Domain y Application: Persona 2.
- Infrastructure, base de datos y API: Persona 3.
- Interfaz web y UX: Persona 4.
- Cada prueba corresponde a la persona responsable de la capa que verifica.

**Precondiciones externas — no repetir estas tareas en SPEC-05**:

- Solución, proyectos, referencias de capas, xUnit, host, conexión y fixture base de SQL Server: completar `specs/001-registrar-servicios/tasks.md` T001-T007.
- Servicios registrados, contrato/listado de servicios y selección disponible en Web: SPEC-01 T010, T014, T030 y T034.
- `dbo.Turnos`, generación/persistencia y fixture de turnos para preparar datos: `specs/002-generar-turno/tasks.md` T001-T003 y T011-T013.
- Consulta de fila existente para comprobar que los turnos `Finalizado` no se cuentan como «Esperando»: `specs/003-consultar-fila-espera/tasks.md` T008-T013.
- `FechaHoraLlamado`, transición `Esperando` → `En atención`, turno actual y bloqueo por servicio compartido con llamadas: `specs/004-llamar-siguiente-turno/tasks.md` T001-T002, T005-T006, T010-T012 y T020-T022.
- Las pruebas deben preparar servicios y turnos con los flujos anteriores o con fixtures aislados. No repetir altas de servicio, generación, consulta de fila ni llamado.

**Evidencia**: Guardar resultados xUnit/API como `.trx`, comparaciones de datos y capturas en `specs/005-finalizar-atencion/evidence/RF05-AT-XX/` y `evidence/CE-XXX/`. Utilizar únicamente datos ficticios y una base de prueba aislada.

## Fase 1: Preparación

La solución, proyectos, paquetes, API base y fixture SQL Server se heredan de SPEC-01. No se crean proyectos ni infraestructura común. Antes de comenzar las fases de historia, deben estar completados los prerrequisitos SPEC-01 a SPEC-04 detallados arriba.

## Fase 2: Fundamentos de persistencia

**Propósito**: Preparar la marca de finalización y habilitar pruebas aisladas con el esquema y bloqueo existentes.

### Infrastructure y base de datos — responsable: Persona 3

- [ ] T001 Crear `src/Servicio.Infrastructure/Database/005-finalizar-atencion.sql` para agregar `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL` a `dbo.Turnos`; la migración conserva todas las filas y valores existentes de servicio, número, cliente, estado y fechas de generación/llamado. **Criterios habilitados**: RF05-AT-01 a RF05-AT-06 y RF05-AT-09; CE-001, CE-004 y CE-005. **Depende de**: `specs/002-generar-turno/tasks.md` T001-T002 y `specs/004-llamar-siguiente-turno/tasks.md` T001.
- [ ] T002 Crear o ampliar `tests/Servicio.Web.Tests/Infrastructure/FinalizarAtencionSqlServerFixture.cs` para usar `SPEC02_SQLSERVER_CONNECTION`, aplicar/verificar cambios SPEC-04/05 y preparar datos aislados con turno activo con nombre y sin nombre, otro servicio activo y turnos en espera; eliminar solo los datos creados por cada prueba. **Criterios habilitados**: RF05-AT-01 a RF05-AT-09; CE-001 a CE-005. **Depende de**: T001, `specs/001-registrar-servicios/tasks.md` T003/T005/T007, `specs/002-generar-turno/tasks.md` T003 y `specs/004-llamar-siguiente-turno/tasks.md` T002.

## Fase 3: Historia de usuario 1 — Finalizar el turno en atención (Prioridad: P1)

**Objetivo**: Finalizar exclusivamente la atención actual del servicio elegido, conservar el registro y dejar el turno actual como «Ninguno», sin llamar al siguiente automáticamente.

**Prueba independiente**: Con un servicio que tenga un turno `En atención`, finalizarlo y comprobar `Finalizado`, la hora de finalización, la confirmación visible y `turnoActual: null`; verificar que un turno esperando no fue llamado.

### Domain y Application — responsable: Persona 2

- [ ] T003 [P] [US1] Crear `tests/Servicio.Domain.Tests/TurnoFinalizacionTests.cs` con pruebas de transición `En atención` → `Finalizado`, registro de `FechaHoraFinalizacion` y rechazo sin mutación cuando el estado de origen no sea `En atención`; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-01/domain.trx` y `RF05-AT-09/domain.trx`. **Criterios**: RF05-AT-01 y RF05-AT-09; CE-001 y CE-004. **Depende de**: `specs/001-registrar-servicios/tasks.md` T003 y `specs/002-generar-turno/tasks.md` T003.
- [ ] T004 [P] [US1] Crear `tests/Servicio.Application.Tests/FinalizarAtencionTests.cs` para verificar que el caso de uso recibe solo `ServicioId`, devuelve el registro confirmado y diferencia servicio inexistente de servicio sin turno activo, sin aceptar `TurnoId` ni hora enviados por Web; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-01/application.trx` y `RF05-AT-08/application.trx`. **Criterios**: RF05-AT-01 y RF05-AT-08. **Depende de**: `specs/001-registrar-servicios/tasks.md` T010 y `specs/004-llamar-siguiente-turno/tasks.md` T006.
- [ ] T005 [US1] Ampliar `src/Servicio.Domain/Turno.cs` con `FechaHoraFinalizacion` nullable y una operación de dominio que solo permita `En atención` → `Finalizado`, guarde la hora que recibe del servidor y rechace cualquier otro estado sin modificar datos; no agregar transiciones desde `Finalizado`. **Criterios**: RF05-AT-01 y RF05-AT-09; CE-001 y CE-004. **Depende de**: T003 y `specs/004-llamar-siguiente-turno/tasks.md` T005.
- [ ] T006 [US1] Crear `src/Servicio.Application/Turnos/IFinalizarAtencionRepository.cs` y `src/Servicio.Application/Turnos/FinalizarAtencion.cs` para definir el caso de uso por `ServicioId`, su resultado con el turno finalizado y resultados diferenciados de servicio inexistente/sin turno activo; no incluir identificador de turno ni hora de finalización en la petición. **Criterios**: RF05-AT-01, RF05-AT-03 y RF05-AT-08. **Depende de**: T004-T005.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T007 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/FinalizarAtencionIntegracionTests.cs` para finalizar un turno del servicio A teniendo otro activo en servicio B; comparar antes/después y confirmar que solo cambia el del servicio A, manteniendo intactos estado y fechas del servicio B; guardar `.trx` y comparación en `specs/005-finalizar-atencion/evidence/RF05-AT-03/`. **Criterio**: RF05-AT-03; apoya CE-001. **Depende de**: T002 y `specs/004-llamar-siguiente-turno/tasks.md` T010.
- [ ] T008 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/FinalizarAtencionApiTests.cs` para comprobar `POST /api/servicios/{servicioId}/turnos/finalizar-atencion` sin cuerpo, respuesta `200`, estado y fecha de fin; comprobar que el endpoint GET existente de SPEC-04 devuelve `turnoActual: null` y que un turno esperando no se llama automáticamente; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-01/api.trx` y `RF05-AT-02/api.trx`. **Criterios**: RF05-AT-01 y RF05-AT-02; CE-001 y CE-002. **Depende de**: T002, `specs/001-registrar-servicios/tasks.md` T007 y `specs/004-llamar-siguiente-turno/tasks.md` T011/T021.
- [ ] T009 [US1] Implementar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` la operación de finalización con Dapper en transacción: adquirir el mismo bloqueo exclusivo transaccional por `ServicioId` usado por SPEC-04, obtener la hora con `SYSDATETIMEOFFSET()`, buscar el turno activo, aplicar la transición Domain y actualizar condicionalmente estado y `FechaHoraFinalizacion` solo si sigue `En atención` y la fecha de fin es nula; confirmar solo si actualizó exactamente una fila. **Criterios**: RF05-AT-01 a RF05-AT-05 y RF05-AT-08 a RF05-AT-09; CE-001, CE-003 y CE-004. **Depende de**: T001, T005-T007 y `specs/004-llamar-siguiente-turno/tasks.md` T010.
- [ ] T010 [US1] Implementar en `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` el endpoint `POST /api/servicios/{servicioId}/turnos/finalizar-atencion` sin cuerpo; devolver `200` con los datos del registro finalizado solo después del commit y `404` para servicio inexistente, dejando explícito el resultado de dominio sin turno activo para su traducción a conflicto en la tarea T025; no disfrazar errores técnicos como rechazos de negocio. **Criterios**: RF05-AT-01 y RF05-AT-04. **Depende de**: T006, T009 y `specs/001-registrar-servicios/tasks.md` T006.

### Interfaz web y UX — responsable: Persona 4

- [ ] T011 [US1] Ampliar `src/Servicio.Web/Pages/Turnos/Llamar.cshtml` y `src/Servicio.Web/wwwroot/js/llamar-turno.js` para ofrecer el botón «Finalizar atención» sobre el servicio seleccionado, sin selector de turnos individuales; en éxito mostrar confirmación, volver a consultar `/api/servicios/{servicioId}/turno-actual` y mostrar «Ninguno» cuando `turnoActual` sea null; no llamar automáticamente al siguiente y mantener etiquetas/navegación por teclado. **Criterios**: RF05-AT-01, RF05-AT-02 y RF05-AT-07; CE-001, CE-002 y CE-006. **Depende de**: T010, `specs/001-registrar-servicios/tasks.md` T030/T034 y `specs/004-llamar-siguiente-turno/tasks.md` T012/T022.
- [ ] T012 [P] [US1] Ejecutar aceptación manual de RF05-AT-01: finalizar un turno activo, comprobar confirmación, fecha/hora persistida mediante respuesta y «Ninguno» en la interfaz; conservar captura y resultado observado en `specs/005-finalizar-atencion/evidence/RF05-AT-01/interfaz.png` y `resultado.md`. **Criterio**: RF05-AT-01; apoya CE-001 y CE-002. **Depende de**: T011 y T008.
- [ ] T013 [P] [US1] Ejecutar aceptación de RF05-AT-02: con un segundo turno en espera, finalizar el actual y después pulsar «Llamar siguiente» como acción separada; comprobar que SPEC-04 llama el siguiente según sus reglas y el registro anterior permanece `Finalizado`; guardar captura/resultado en `specs/005-finalizar-atencion/evidence/RF05-AT-02/`. **Criterio**: RF05-AT-02; apoya CE-001 y CE-002. **Depende de**: T011 y T008.
- [ ] T014 [P] [US1] Ejecutar aceptación de RF05-AT-03 con dos servicios activos; finalizar solo el servicio elegido y comprobar mediante respuesta/UI y snapshot SQL que el turno del otro servicio no cambió; guardar evidencia en `specs/005-finalizar-atencion/evidence/RF05-AT-03/`. **Criterio**: RF05-AT-03. **Depende de**: T011 y T007.

## Fase 4: Historia de usuario 2 — Conservar el registro de atención finalizada (Prioridad: P1)

**Objetivo**: Mantener en el registro persistente el número, servicio, cliente opcional, estado y marcas de generación, llamado y finalización, incluso después de reiniciar el host.

**Prueba independiente**: Finalizar un turno con nombre y uno sin nombre; comparar datos antes/después y, para el primero, recrear el host y comprobar el registro en SQL Server sin agregar una pantalla de historial.

### Domain y Application — responsable: Persona 2

- [ ] T015 [P] [US2] Ampliar `tests/Servicio.Application.Tests/FinalizarAtencionTests.cs` para comprobar que el caso de uso conserva `NombreCliente = null` cuando el turno no tiene nombre y devuelve el registro persistido sin fabricar ni sobrescribir ese dato; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-05/application.trx`. **Criterio**: RF05-AT-05. **Depende de**: T006.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T016 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/RegistroFinalizadoConservadoTests.cs` para comparar antes/después `ServicioId`, `NumeroTurno`, `NombreCliente`, `FechaHoraGeneracion` y `FechaHoraLlamado`, verificar `Estado = Finalizado` y `FechaHoraFinalizacion` no nula, tanto con nombre como con `NULL`; guardar `.trx` y snapshots en `specs/005-finalizar-atencion/evidence/RF05-AT-04/` y `RF05-AT-05/`. **Criterios**: RF05-AT-04 y RF05-AT-05; CE-005. **Depende de**: T002 y T009.
- [ ] T017 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/FinalizadoPersistidoTrasReinicioTests.cs` para finalizar un turno con nombre, recrear la instancia del host y volver a leer directamente el registro mediante el repositorio/SQL Server de prueba; verificar número, servicio, nombre, `Finalizado` y las tres marcas temporales; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-06/persistencia.trx`. **Criterio**: RF05-AT-06; CE-005. **Depende de**: T002 y T009.
- [ ] T018 [US2] Asegurar en `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` que la actualización de finalización solo cambia `Estado` y `FechaHoraFinalizacion`; incluir en la respuesta `ServicioId`, `NumeroTurno`, `NombreCliente` nullable y fechas de generación/llamado/finalización sin modificar los valores preexistentes. **Criterios**: RF05-AT-04 a RF05-AT-06; CE-005. **Depende de**: T009 y la validación de T016.

### Interfaz web y UX — responsable: Persona 4

- [ ] T019 [P] [US2] Ejecutar aceptación de RF05-AT-04 y RF05-AT-05: finalizar un turno con nombre y otro con nombre ausente; verificar por las respuestas de la operación los datos conservados y `null` opcional, sin agregar UI de búsqueda histórica; guardar capturas/notas en `specs/005-finalizar-atencion/evidence/RF05-AT-04/` y `RF05-AT-05/`. **Criterios**: RF05-AT-04 y RF05-AT-05; apoya CE-005. **Depende de**: T011 y T016.
- [ ] T020 [P] [US2] Ejecutar aceptación de persistencia RF05-AT-06: finalizar un turno, reiniciar el host y verificar con la prueba de integración SQL Server el mismo registro y sus campos conservados; guardar el resultado y captura de la operación en `specs/005-finalizar-atencion/evidence/RF05-AT-06/`. **Criterio**: RF05-AT-06; CE-005. **Depende de**: T011 y T017.

## Fase 5: Historia de usuario 3 — Recibir indicaciones ante una finalización no válida (Prioridad: P1)

**Objetivo**: Explicar la falta de selección, la ausencia de turno en atención y el rechazo de repetir/cambiar un turno `Finalizado`, sin mutaciones involuntarias.

**Prueba independiente**: Probar los tres rechazos y comparar el estado y todos los campos del turno antes/después. Enviar además dos finalizaciones simultáneas para el mismo turno: exactamente una operación se confirma.

### Domain y Application — responsable: Persona 2

- [ ] T021 [P] [US3] Ampliar `tests/Servicio.Domain.Tests/TurnoFinalizacionTests.cs` con una prueba explícita de terminalidad: desde `Finalizado` rechazar una segunda finalización y cualquier intento de cambio de estado, conservando estado, fecha/hora de fin, número, cliente y demás propiedades; guardar `.trx` y snapshot en `specs/005-finalizar-atencion/evidence/RF05-AT-09/domain.trx`. **Criterio**: RF05-AT-09; CE-004. **Depende de**: T005.
- [ ] T022 [P] [US3] Ampliar `tests/Servicio.Application.Tests/FinalizarAtencionTests.cs` para verificar que ausencia de turno activo devuelve un resultado de rechazo sin solicitar escrituras ni convertir el resultado en éxito; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-08/application.trx`. **Criterio**: RF05-AT-08; apoya CE-003. **Depende de**: T006.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T023 [P] [US3] Crear `tests/Servicio.Web.Tests/Infrastructure/FinalizacionesSimultaneasTests.cs` con SQL Server real para enviar dos finalizaciones simultáneas al mismo servicio con un turno activo; exigir exactamente una respuesta `200` y una `409 sin_turno_en_atencion`, una única marca de fin, datos previos intactos y cero turnos que permanezcan `En atención`; guardar `.trx` y consultas de comprobación en `specs/005-finalizar-atencion/evidence/RF05-AT-09/concurrencia.trx`. **Criterio**: RF05-AT-09; CE-004. **Depende de**: T002, T009 y T010.
- [ ] T024 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/FinalizarAtencionSinTurnoTests.cs` para comprobar `409`, código `sin_turno_en_atencion`, mensaje claro y ausencia de cambios cuando el servicio existe pero no tiene turno activo; incluir segundo POST tras una finalización ya confirmada y comparar íntegramente el turno; guardar `.trx` y comparación en `specs/005-finalizar-atencion/evidence/RF05-AT-08/` y `RF05-AT-09/`. **Criterios**: RF05-AT-08 y RF05-AT-09; CE-003 y CE-004. **Depende de**: T002 y T010.
- [ ] T025 [US3] Implementar en `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` la traducción de servicio sin turno activo a `409` con código y mensaje `sin_turno_en_atencion`; impedir que reintentar una operación sobre un turno finalizado se represente como éxito y preservar errores técnicos explícitos. **Criterios**: RF05-AT-08 y RF05-AT-09; CE-003 y CE-004. **Depende de**: T010 y T024.

### Interfaz web y UX — responsable: Persona 4

- [ ] T026 [US3] Actualizar `src/Servicio.Web/wwwroot/js/llamar-turno.js` para que, sin servicio seleccionado, el botón «Finalizar atención» muestre «Selecciona un servicio para finalizar la atención» y no emita petición; para `409 sin_turno_en_atencion`, mostrar el mensaje de rechazo y conservar el estado visible sin fingir éxito. **Criterios**: RF05-AT-07 y RF05-AT-08; CE-003. **Depende de**: T011 y T025.
- [ ] T027 [P] [US3] Crear `tests/Servicio.Web.Tests/Ui/FinalizarAtencionSinSeleccionTests.cs` para comprobar que pulsar «Finalizar atención» sin servicio pide seleccionar, no envía POST y no altera la pantalla/datos; guardar `.trx` en `specs/005-finalizar-atencion/evidence/RF05-AT-07/ui.trx`. **Criterio**: RF05-AT-07; CE-003. **Depende de**: T011.
- [ ] T028 [P] [US3] Ejecutar aceptación manual de RF05-AT-07 y RF05-AT-08: capturar falta de selección sin petición y servicio seleccionado sin turno en atención con mensaje y datos intactos; guardar capturas/resultados en `specs/005-finalizar-atencion/evidence/RF05-AT-07/` y `RF05-AT-08/`. **Criterios**: RF05-AT-07 y RF05-AT-08; CE-003. **Depende de**: T026, T027 y T024.
- [ ] T029 [P] [US3] Ejecutar aceptación manual de RF05-AT-09 repitiendo la finalización y verificando el rechazo; adjuntar la evidencia automatizada de transición terminal y concurrencia, y confirmar que el registro no cambia, en `specs/005-finalizar-atencion/evidence/RF05-AT-09/`. **Criterio**: RF05-AT-09; CE-004. **Depende de**: T021, T023-T026.

## Fase 6: Evidencias de criterios de éxito y trazabilidad

**Propósito**: Consolidar evidencia medida para cada criterio de éxito y actualizar la matriz de trazabilidad al final.

### Evidencia por criterios de éxito — responsables de las capas verificadas

- [ ] T030 [P] Consolidar CE-001 con resultados de Domain, API/SQL y captura de confirmación de finalización correcta; documentar cantidad de pruebas ejecutadas y resultado real en `specs/005-finalizar-atencion/evidence/CE-001/resultado.md`. **Criterio**: CE-001. **Responsables**: Personas 2, 3 y 4. **Depende de**: T003, T008-T012.
- [ ] T031 [P] Consolidar CE-002 con respuesta del endpoint de turno actual y captura que muestre «Ninguno» después de finalizar, además del caso de llamado posterior separado; guardar evidencia en `specs/005-finalizar-atencion/evidence/CE-002/resultado.md`. **Criterio**: CE-002. **Responsables**: Personas 3 y 4. **Depende de**: T008, T011-T013.
- [ ] T032 [P] Consolidar CE-003 con respuesta/capturas de falta de selección y servicio sin activo, junto con comparaciones sin cambios; guardar resultados en `specs/005-finalizar-atencion/evidence/CE-003/resultado.md`. **Criterio**: CE-003. **Responsables**: Personas 2, 3 y 4. **Depende de**: T022, T024-T028.
- [ ] T033 [P] Consolidar CE-004 con prueba Domain de estado terminal, rechazo de segundo POST y dos finalizaciones simultáneas que demuestren un solo éxito; guardar `.trx` y resultado observado en `specs/005-finalizar-atencion/evidence/CE-004/resultado.md`. **Criterio**: CE-004. **Responsables**: Personas 2 y 3. **Depende de**: T021, T023-T025.
- [ ] T034 [P] Consolidar CE-005 con la comprobación antes/después y reinicio del host, incluyendo el valor observado de cada campo conservado y las tres marcas temporales, en `specs/005-finalizar-atencion/evidence/CE-005/resultado.md`. **Criterio**: CE-005. **Responsables**: Personas 2 y 3. **Depende de**: T016-T018.
- [ ] T035 [P] Medir CE-006 desde seleccionar el servicio hasta reconocer la confirmación y «Ninguno»; registrar duración real, entorno, evidencia y si cumple el umbral de 30 segundos en `specs/005-finalizar-atencion/evidence/CE-006/resultado.md`. **Criterio**: CE-006. **Responsable**: Persona 4. **Depende de**: T011-T012.

### Cierre — responsables: Personas 2, 3 y 4

- [ ] T036 Actualizar la matriz de aceptación y pruebas en `specs/005-finalizar-atencion/plan.md`, enlazando RF05-AT-01 a RF05-AT-09 y CE-001 a CE-006 con las tareas T003-T035 y sus evidencias; registrar resultados observados y dejar explícitamente pendientes los casos que no se ejecutaron. **Criterios**: RF05-AT-01 a RF05-AT-09 y CE-001 a CE-006. **Depende de**: T003-T035.

## Dependencias entre historias

- Las tres historias dependen de los prerrequisitos compartidos de SPEC-01 a SPEC-04 y de la Fase 2 (columna de finalización y fixture).
- US1 implementa la transición, la persistencia atómica, el endpoint y la acción de interfaz.
- US2 verifica conservación y persistencia sobre la operación de US1; no agrega una pantalla histórica.
- US3 verifica rechazos, terminalidad y concurrencia sobre la misma operación. No puede comenzar su integración concurrente antes de que el repositorio y endpoint estén disponibles.
- La tarea T036 es la última; depende de la ejecución y evidencia previa, no solo de que existan los archivos de prueba.

## Oportunidades de paralelismo

- T003 y T004 pueden desarrollarse en paralelo en proyectos de prueba distintos; T007 y T008 pueden prepararse en paralelo una vez disponible la fixture T002.
- Dentro de US2, T015-T017 pueden desarrollarse en paralelo en archivos de pruebas distintos tras el caso de uso/fixture; T018 integra persistencia y T019-T020 son aceptaciones separadas.
- En US3, T021 y T022 verifican Domain/Application en paralelo; T023 y T024 pueden prepararse en paralelo, pero deben serializarse las ejecuciones que compartan el mismo servicio de fixture.
- Las consolidaciones T030-T035 son independientes por criterio una vez terminadas sus pruebas de origen; T036 espera todas las evidencias.
- No ejecutar a la vez pruebas que manipulen la misma instancia de servicio o turno en SQL Server; usar fixtures/datos aislados.

## Estrategia de implementación

### MVP sugerido: Historia de usuario 1

1. Completar precondiciones SPEC-01 a SPEC-04 y la Fase 2 de SPEC-05.
2. Implementar la transición terminal, actualización transaccional compartiendo bloqueo con SPEC-04, endpoint y botón «Finalizar atención».
3. Verificar RF05-AT-01 a RF05-AT-03 y CE-001/CE-002 antes de aceptar el MVP.

### Entrega incremental

1. Incorporar US2 y probar que la información sobrevive al reinicio sin agregar consulta histórica.
2. Incorporar US3, incluyendo rechazo de `Finalizado` y dos finalizaciones simultáneas con exactamente una operación exitosa.
3. Consolidar CE-001 a CE-006 y completar T036 con resultados observados.

## Validación del formato

Las tareas usan casilla `- [ ]`, IDs consecutivos desde T001, `[P]` solo cuando los archivos y dependencias permiten paralelismo, y etiqueta `[US1]`, `[US2]` o `[US3]` en las fases de historia. Cada tarea indica archivos concretos, responsable, criterios de aceptación, dependencias y ubicación de evidencia cuando corresponde.
