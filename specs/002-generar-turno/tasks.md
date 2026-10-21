# Tareas: Generar turno (SPEC-02)

**Entrada**: documentos de diseño en `specs/002-generar-turno/`.

**Base de diseño**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md) y [quickstart.md](./quickstart.md).

**Responsables**:

- Domain y Application: Persona 2.
- Infrastructure, base de datos y API: Persona 3.
- Interfaz web y UX: Persona 4.

**Prerrequisitos externos de SPEC-01 — no repetir en esta lista**:

- La solución, los proyectos y los proyectos de pruebas deben existir: SPEC-01 T001-T003.
- La tabla `dbo.Servicios`, conexión SQL Server y host API deben estar disponibles: SPEC-01 T004-T007.
- La interfaz de repositorio y el repositorio SQL Server de servicios deben existir: SPEC-01 T010 y T014.
- El listado API y la interfaz que muestran servicios deben estar implementados: SPEC-01 T030 y T034.
- Las tareas de SPEC-02 que requieran servicios registrados usan los servicios creados según SPEC-01; no vuelven a implementar su alta ni su consulta.

**Evidencias**: Guardar resultados automatizados `.trx`, capturas y notas de aceptación en `specs/002-generar-turno/evidence/RF02-AT-XX/` o `evidence/CE-XXX/`, según corresponda. Usar exclusivamente una base SQL Server de prueba y datos ficticios.

## Fase 1: Preparación

La solución, los proyectos, la configuración general de SQL Server/Dapper y el host Web se reutilizan de SPEC-01. No se crean proyectos ni se repiten tareas de registro o consulta de servicios.

## Fase 2: Fundamentos de persistencia y pruebas

**Propósito**: Añadir el almacenamiento y la asignación atómica necesarios antes de completar los flujos de generación.

### Infrastructure y base de datos — responsable: Persona 3

- [ ] T001 Crear `src/Servicio.Infrastructure/Database/002-create-turnos.sql` con `dbo.Turnos` y `dbo.ContadoresTurno`, claves foráneas a `dbo.Servicios`, campos de fecha/hora local, nombre nullable de hasta 100 caracteres, estado inicial persistido y restricción única `(ServicioId, FechaTurno, NumeroTurno)`. **Criterios habilitados**: RF02-AT-01, RF02-AT-04 a RF02-AT-11. **Depende de**: SPEC-01 T004.
- [ ] T002 Implementar el procedimiento transaccional de asignación en `src/Servicio.Infrastructure/Database/002-create-turnos.sql`: adquirir bloqueo exclusivo por servicio con alcance transaccional, capturar `SYSDATETIMEOFFSET()` después del bloqueo, crear o incrementar el contador por servicio/fecha, guardar turno y contador en una misma transacción, revertir ambos ante fallo y devolver el correlativo como texto. Rechazar agotamiento de 38 dígitos sin alterar los datos. **Criterios habilitados**: RF02-AT-01, RF02-AT-04 a RF02-AT-08 y RF02-AT-11. **Depende de**: T001 y SPEC-01 T005.
- [ ] T003 Preparar `tests/Servicio.Web.Tests/Infrastructure/TurnosSqlServerFixture.cs` para ejecutar pruebas con `SPEC02_SQLSERVER_CONNECTION`, aislar los datos de cada prueba y limpiar solo los registros que ella creó; no usar ni modificar una base productiva. **Criterios habilitados**: RF02-AT-01 a RF02-AT-12. **Depende de**: SPEC-01 T003, T005 y T007.

## Fase 3: Historia de usuario 1 — Generar y entregar el número (Prioridad: P1)

**Objetivo**: Generar un turno para un servicio existente, asignar estado y fecha/hora, y mostrar el número con confirmación.

**Prueba independiente**: Con servicios existentes según SPEC-01, enviar una solicitud válida y comprobar `201`, `C-001`, servicio, estado «Esperando», fecha/hora persistida y confirmación visible.

### Domain y Application — responsable: Persona 2

- [ ] T004 [P] [US1] Crear `tests/Servicio.Domain.Tests/TurnoTests.cs` con pruebas del estado inicial «Esperando», los datos de generación y la representación del número con prefijo y mínimo de tres dígitos; comprobar que Domain no depende de Infrastructure ni Web. **Criterios**: RF02-AT-01. **Depende de**: SPEC-01 T003.
- [ ] T005 [P] [US1] Crear `tests/Servicio.Application.Tests/GenerarTurnoTests.cs` para verificar servicio existente, resultado válido, rechazo de servicio inexistente sin invocar la asignación y propagación de errores técnicos; preparar los casos antes de implementar el caso de uso. **Criterios**: RF02-AT-01 y RF02-AT-02. **Depende de**: SPEC-01 T003 y T010.
- [ ] T006 [US1] Implementar `src/Servicio.Domain/Turno.cs` con los datos del turno, formato del número y estado inicial «Esperando», sin referencias a otras capas ni a persistencia. **Criterio**: RF02-AT-01. **Depende de**: T004.
- [ ] T007 [US1] Definir en `src/Servicio.Application/Turnos/` el contrato de generación de turnos y el caso de uso `GenerarTurno`; reutilizar el contrato de consulta de servicios de SPEC-01, validar que el servicio exista antes de asignar el turno y devolver el resultado persistido sin calcular el siguiente correlativo. **Criterios**: RF02-AT-01 y RF02-AT-02. **Depende de**: T005, T006 y SPEC-01 T010.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T008 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/GenerarTurnoValidoTests.cs` para comprobar `POST /api/servicios/{servicioId}/turnos`, respuesta `201`, número `C-001`, estado, servicio y fecha/hora persistidos; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-01/pruebas.trx`. **Criterio**: RF02-AT-01. **Depende de**: T003 y SPEC-01 T007.
- [ ] T009 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/GenerarTurnoSinServicioTests.cs` para verificar que una solicitud sin identificador válido se rechaza con mensaje claro y no inserta filas; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-02/pruebas.trx`. **Criterio**: RF02-AT-02. **Depende de**: T003 y SPEC-01 T007.
- [ ] T010 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/GenerarTurnoSinServiciosTests.cs` para verificar el estado vacío del listado de SPEC-01 y que no puede crearse un turno para un identificador inexistente; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-03/pruebas.trx`. **Criterio**: RF02-AT-03. **Depende de**: T003 y SPEC-01 T007 y T030.
- [ ] T011 [US1] Implementar `src/Servicio.Infrastructure/Turnos/SqlServerTurnoRepository.cs` con Dapper para invocar el procedimiento, pasar el servicio y el nombre validado, mapear el número/correlativo como texto y propagar errores de persistencia; no asignar ni devolver el número antes de confirmar la transacción. **Criterios**: RF02-AT-01, RF02-AT-02 y RF02-AT-11. **Depende de**: T002, T007 y SPEC-01 T005 y T014.
- [ ] T012 [US1] Implementar `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` con `POST /api/servicios/{servicioId}/turnos`, conectado a `GenerarTurno`; responder `201`, `404` para servicio inexistente y errores explícitos sin disfrazar fallos técnicos. **Criterios**: RF02-AT-01 y RF02-AT-02. **Depende de**: T007, T011 y SPEC-01 T006.

### Interfaz web y UX — responsable: Persona 4

- [ ] T013 [US1] Crear `src/Servicio.Web/Pages/Turnos/Generar.cshtml` y `src/Servicio.Web/wwwroot/js/turnos.js` para seleccionar servicios desde `GET /api/servicios`, enviar la solicitud al API del mismo origen y mostrar el número, servicio, estado y confirmación; si la lista está vacía, informar que primero se registre un servicio. **Criterios**: RF02-AT-01 a RF02-AT-03. **Depende de**: T012 y SPEC-01 T030 y T034.
- [ ] T014 [P] [US1] Ejecutar la aceptación manual de RF02-AT-01 en `/turnos/generar`; guardar captura del número, estado y confirmación y el resultado observado en `specs/002-generar-turno/evidence/RF02-AT-01/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-01. **Depende de**: T013.
- [ ] T015 [P] [US1] Ejecutar la aceptación manual de RF02-AT-02 sin selección de servicio; comprobar mensaje comprensible y ausencia de turno, y guardar captura y resultado en `specs/002-generar-turno/evidence/RF02-AT-02/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-02. **Depende de**: T013.
- [ ] T016 [P] [US1] Ejecutar la aceptación manual de RF02-AT-03 con el listado vacío; comprobar aviso para registrar primero un servicio y ausencia de opción válida, y guardar captura y resultado en `specs/002-generar-turno/evidence/RF02-AT-03/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-03. **Depende de**: T013 y SPEC-01 T030 y T034.

## Fase 4: Historia de usuario 2 — Mantener la numeración por servicio y día (Prioridad: P1)

**Objetivo**: Mantener correlativos independientes por servicio y día, registrar el orden de llegada y conservar unicidad bajo concurrencia.

**Prueba independiente**: Crear turnos consecutivos para el mismo servicio, servicios distintos y días distintos; verificar el salto `999` a `1000`, fecha/hora y unicidad con solicitudes simultáneas.

### Domain y Application — responsable: Persona 2

- [ ] T017 [P] [US2] Ampliar `tests/Servicio.Domain.Tests/TurnoTests.cs` con casos de formato `C-001`, `C-999`, `C-1000` y correlativo de 38 dígitos, sin truncamiento ni pérdida de precisión; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-08/dominio.trx`. **Criterio**: RF02-AT-08. **Depende de**: T006.
- [ ] T018 [US2] Ajustar `src/Servicio.Domain/Turno.cs` para conservar el correlativo como texto y representarlo con tres dígitos mínimos, ampliando el ancho después de 999 y soportando el máximo de 38 dígitos sin mapearlo al `decimal` de .NET. **Criterios**: RF02-AT-01 y RF02-AT-08. **Depende de**: T017.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T019 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/TurnoSecuencialTests.cs` para generar dos turnos del mismo servicio y verificar `C-001` y `C-002`; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-04/pruebas.trx`. **Criterio**: RF02-AT-04. **Depende de**: T003, T002 y T011.
- [ ] T020 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/TurnosServiciosIndependientesTests.cs` para comprobar que dos servicios inician en `001` con sus propios prefijos; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-05/pruebas.trx`. **Criterio**: RF02-AT-05. **Depende de**: T003, T002 y T011.
- [ ] T021 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/ReinicioDiarioTurnoTests.cs` para sembrar contador/turno del día previo y verificar que el nuevo día empieza en `001` sin alterar los registros anteriores; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-06/pruebas.trx`. **Criterio**: RF02-AT-06. **Depende de**: T003, T002 y T011.
- [ ] T022 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/OrdenLlegadaTurnoTests.cs` para verificar que `FechaTurno` y `FechaHoraGeneracion` proceden de la misma hora local del servidor y que el orden es ascendente con correlativo como desempate; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-07/pruebas.trx`. **Criterio**: RF02-AT-07. **Depende de**: T003, T002 y T011.
- [ ] T023 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/GeneracionTurnosConcurrentesTests.cs` que lance solicitudes simultáneas al mismo servicio y compruebe que todas las respuestas y filas tienen números únicos, consecutivos, y que la restricción única no detecta duplicados; guardar el `.trx` en `specs/002-generar-turno/evidence/RF02-AT-04/concurrencia.trx`. **Criterios**: RF02-AT-04 y RF02-AT-05; apoya CE-002. **Depende de**: T003, T002 y T011.
- [ ] T024 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/SaltoCorrelativoMilTests.cs` para preparar el contador en 999 y verificar la respuesta `C-1000`, incluyendo formato, inserción y precisión; guardar el resultado en `specs/002-generar-turno/evidence/RF02-AT-08/integracion.trx`. **Criterio**: RF02-AT-08. **Depende de**: T003, T002 y T011.

### Interfaz web y UX — responsable: Persona 4

- [ ] T025 [P] [US2] Ejecutar aceptación manual de RF02-AT-04 con dos generaciones secuenciales para el mismo servicio; capturar ambos números y guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-04/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-04. **Depende de**: T013 y T019.
- [ ] T026 [P] [US2] Ejecutar aceptación manual de RF02-AT-05 con dos servicios distintos; comprobar que ambos comienzan en `001` con el prefijo correcto y guardar evidencia en `specs/002-generar-turno/evidence/RF02-AT-05/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-05. **Depende de**: T013 y T020.
- [ ] T027 [P] [US2] Ejecutar aceptación guiada de RF02-AT-06 en la base de prueba con datos de ambos días; verificar el reinicio a `001` y la conservación del turno anterior, y guardar consulta/captura y resultado en `specs/002-generar-turno/evidence/RF02-AT-06/`. **Criterio**: RF02-AT-06. **Depende de**: T021.
- [ ] T028 [P] [US2] Ejecutar aceptación manual de RF02-AT-07 y comprobar que la fecha/hora mostrada corresponde a la generación y respeta el orden; guardar captura y resultado en `specs/002-generar-turno/evidence/RF02-AT-07/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-07. **Depende de**: T013 y T022.
- [ ] T029 [P] [US2] Ejecutar aceptación manual de RF02-AT-08 con contador preparado en 999 en la base de prueba; comprobar y capturar `C-1000` en `specs/002-generar-turno/evidence/RF02-AT-08/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-08. **Depende de**: T013 y T024.

## Fase 5: Historia de usuario 3 — Asociar nombre opcional y conservar el turno (Prioridad: P1)

**Objetivo**: Asociar un nombre válido cuando se proporciona, aceptar nombre omitido/vacío y preservar los datos tras reiniciar la aplicación; rechazar nombres mayores a 100 caracteres.

**Prueba independiente**: Generar turnos con nombre, sin nombre y con espacios; rechazar un nombre de 101 caracteres sin asignar correlativo ni insertar turno; recrear el host y verificar persistencia.

### Domain y Application — responsable: Persona 2

- [ ] T030 [P] [US3] Ampliar `tests/Servicio.Domain.Tests/TurnoTests.cs` y `tests/Servicio.Application.Tests/GenerarTurnoTests.cs` para probar nombre informado, nombre nulo/vacío/solo espacios y rechazo de 101 caracteres antes de llamar al repositorio; guardar resultados en `specs/002-generar-turno/evidence/RF02-AT-09/dominio.trx`, `RF02-AT-10/dominio.trx` y `RF02-AT-12/dominio.trx`. **Criterios**: RF02-AT-09, RF02-AT-10 y RF02-AT-12. **Depende de**: T006 y T007.
- [ ] T031 [US3] Implementar en `src/Servicio.Domain/Turno.cs` y `src/Servicio.Application/Turnos/GenerarTurno.cs` la normalización de nombre vacío o solo espacios a no informado y el rechazo de más de 100 caracteres antes de solicitar un correlativo; conservar sin cambios el texto válido informado. **Criterios**: RF02-AT-09, RF02-AT-10 y RF02-AT-12. **Depende de**: T030.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T032 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/NombreClientePersistidoTests.cs` para verificar que un nombre proporcionado se guarda y devuelve asociado al turno; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-09/pruebas.trx`. **Criterio**: RF02-AT-09. **Depende de**: T003, T011 y T012.
- [ ] T033 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/NombreClienteVacioTests.cs` para enviar valor omitido, vacío y solo espacios, verificar turno creado y nombre `NULL` persistido; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-10/pruebas.trx`. **Criterio**: RF02-AT-10. **Depende de**: T003, T011 y T012.
- [ ] T034 [P] [US3] Crear `tests/Servicio.Web.Tests/Infrastructure/TurnosPersistenTrasReinicioTests.cs` para generar un turno, recrear el host y verificar desde SQL Server número, servicio, estado, fecha/hora y nombre; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-11/pruebas.trx`. **Criterio**: RF02-AT-11. **Depende de**: T003, T011 y T012.
- [ ] T035 [P] [US3] Crear `tests/Servicio.Web.Tests/Api/NombreClienteLongitudMaximaTests.cs` para verificar que 101 caracteres producen `400` y mensaje claro, sin insertar turno ni incrementar contador, y que 100 caracteres son admitidos; guardar resultado en `specs/002-generar-turno/evidence/RF02-AT-12/pruebas.trx`. **Criterio**: RF02-AT-12. **Depende de**: T003, T011 y T012.
- [ ] T036 [US3] Actualizar `src/Servicio.Web/Endpoints/TurnosEndpoints.cs` y el contrato `specs/002-generar-turno/contracts/openapi.yaml` para validar el límite de 100 caracteres y responder `400` con error por campo antes de abrir la asignación; preservar el rechazo sin cambios de datos y no convertir fallos técnicos en validaciones. **Criterios**: RF02-AT-09, RF02-AT-10 y RF02-AT-12. **Depende de**: T031, T035 y T012.

### Interfaz web y UX — responsable: Persona 4

- [ ] T037 [US3] Actualizar `src/Servicio.Web/Pages/Turnos/Generar.cshtml` y `src/Servicio.Web/wwwroot/js/turnos.js` con campo opcional de nombre, etiqueta accesible, límite visible de 100 caracteres, mensajes claros de validación/error y confirmación de nombre cuando se informó; conservar navegación por teclado. **Criterios**: RF02-AT-09, RF02-AT-10 y RF02-AT-12. **Depende de**: T013 y T036.
- [ ] T038 [P] [US3] Ejecutar aceptación manual de RF02-AT-09 con nombre válido; verificar su asociación y guardar captura/resultado en `specs/002-generar-turno/evidence/RF02-AT-09/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-09. **Depende de**: T037 y T032.
- [ ] T039 [P] [US3] Ejecutar aceptación manual de RF02-AT-10 dejando el nombre vacío y usando solo espacios; verificar que el turno se genera sin nombre informado y guardar captura/resultado en `specs/002-generar-turno/evidence/RF02-AT-10/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-10. **Depende de**: T037 y T033.
- [ ] T040 [P] [US3] Ejecutar aceptación manual de RF02-AT-11: generar y persistir un turno, reiniciar el host y comprobar sus datos en la base de prueba; guardar captura/consulta y resultado en `specs/002-generar-turno/evidence/RF02-AT-11/`. No agregar consulta histórica a la interfaz. **Criterio**: RF02-AT-11. **Depende de**: T034 y T037.
- [ ] T041 [P] [US3] Ejecutar aceptación manual de RF02-AT-12 con un nombre de 101 caracteres; verificar mensaje claro, ausencia de turno y contador sin cambios, y guardar captura/resultado en `specs/002-generar-turno/evidence/RF02-AT-12/interfaz.png` y `resultado.md`. **Criterio**: RF02-AT-12. **Depende de**: T037 y T035.

## Fase 6: Evidencia de criterios de éxito y trazabilidad

**Propósito**: Consolidar resultados reales por criterio; no marcar pruebas pendientes como aprobadas.

### Evidencia por capa y responsable de prueba

- [ ] T042 [P] Consolidar el resultado de RF02-AT-01, RF02-AT-04 y RF02-AT-08 para CE-001, incluyendo número/prefijo, estado y confirmación en `specs/002-generar-turno/evidence/CE-001/resultado.md`; adjuntar los resultados y capturas que lo sustentan. **Criterio**: CE-001. **Responsable**: Persona 4. **Depende de**: T014, T025 y T029.
- [ ] T043 [P] Consolidar para CE-002 los resultados de secuencia por servicio/día, reinicio diario y generación concurrente; verificar números únicos y consecutivos y guardar la síntesis en `specs/002-generar-turno/evidence/CE-002/resultado.md`. **Criterio**: CE-002. **Responsable**: Persona 3. **Depende de**: T019 a T023.
- [ ] T044 [P] Consolidar para CE-003 las respuestas, mensajes y comprobación de ausencia de filas de RF02-AT-02 y RF02-AT-03 en `specs/002-generar-turno/evidence/CE-003/resultado.md`; adjuntar `.trx` y capturas. **Criterio**: CE-003. **Responsable**: Personas 3 y 4 según las pruebas API/UI. **Depende de**: T009, T010, T015 y T016.
- [ ] T045 [P] Consolidar para CE-004 la prueba de persistencia tras reinicio, con número, servicio, estado, fecha/hora y nombre cuando fue informado, en `specs/002-generar-turno/evidence/CE-004/resultado.md`; adjuntar `.trx` y verificación manual. **Criterio**: CE-004. **Responsable**: Personas 3 y 4 según las pruebas SQL/UI. **Depende de**: T034 y T040.
- [ ] T046 [P] Medir la aceptación CE-005 desde la selección del servicio hasta leer el número; consignar tiempo observado, entorno, captura y resultado en `specs/002-generar-turno/evidence/CE-005/resultado.md`. **Criterio**: CE-005. **Responsable**: Persona 4. **Depende de**: T014.

### Cierre de SPEC-02 — responsable: Personas 2, 3 y 4

- [ ] T047 Actualizar la tabla de trazabilidad de `specs/002-generar-turno/plan.md` para enlazar RF02-AT-01 a RF02-AT-12 y CE-001 a CE-005 con los IDs T004-T046, las rutas de evidencia y el resultado efectivamente obtenido; señalar como pendiente cualquier prueba/evidencia no ejecutada, sin declarar aceptación por inferencia. **Criterios**: RF02-AT-01 a RF02-AT-12 y CE-001 a CE-005. **Depende de**: T004 a T046.

## Dependencias y orden de ejecución

### Dependencias externas con SPEC-01

- Antes de las tareas que consultan o persisten turnos, deben completarse en `specs/001-registrar-servicios/tasks.md` T001-T007 (solución, proyectos, base de datos, configuración y host), T010 y T014 (contrato y repositorio de servicios), y T030/T034 (listado API e interfaz de servicios).
- Los servicios de prueba se registran usando SPEC-01; SPEC-02 no vuelve a crear la tabla de servicios, su alta ni su endpoint.
- T001-T003 preparan persistencia y fixture de SPEC-02; no sustituyen los prerrequisitos de SPEC-01.

### Dependencias entre fases e historias

- Fase 2 prepara las tablas, procedimiento de asignación y fixture antes de las pruebas de integración.
- US1 depende de Fase 2 y de SPEC-01; permite generar un turno válido y rechazar un servicio inválido.
- US2 depende de la generación/repo de US1 y de la persistencia transaccional de Fase 2. Sus pruebas cubren secuencia, concurrencia, reloj del servidor, cambio de día y salto de 999 a 1000.
- US3 depende del flujo/API de US1; aplica validación del nombre antes de asignar correlativo y comprueba la persistencia tras reiniciar.
- La fase de evidencia consolida resultados de las tres historias; T047 es la última tarea y depende de los resultados/evidencias anteriores.

### Oportunidades de paralelismo

- T001 y T003 pueden prepararse en paralelo una vez disponibles los proyectos y recursos de prueba de SPEC-01; T002 depende de T001.
- Dentro de US1, T004 y T005 pueden desarrollarse en paralelo; las pruebas API T008-T010 son independientes entre sí. Las aceptaciones manuales T014-T016 son independientes tras completar T013.
- Dentro de US2, las pruebas T019-T024 cubren archivos/casos separados y pueden prepararse en paralelo una vez disponible el repositorio y el fixture. Las aceptaciones T025-T029 pueden ejecutarse por separado sobre datos de prueba aislados.
- Dentro de US3, T030, T032-T035 pueden prepararse en paralelo en archivos separados una vez disponibles sus fixtures/proyectos; T038-T041 también pueden ejecutarse en paralelo usando datos aislados.
- T042-T046 consolidan criterios de éxito distintos y pueden prepararse en paralelo después de terminar sus dependencias; T047 no puede comenzar hasta cerrar las evidencias.
- El paralelismo de desarrollo entre historias es posible después de Fase 2 y de tener las interfaces comunes de US1; las integraciones de US2/US3 requieren los contratos y el repositorio de generación.

## Estrategia de implementación

### MVP recomendado: Historia de usuario 1

1. Completar los prerrequisitos de SPEC-01 y la Fase 2 de SPEC-02.
2. Completar US1: dominio/caso de uso, persistencia, API y pantalla mínima de generación.
3. Ejecutar RF02-AT-01 a RF02-AT-03 y conservar resultados/capturas; no avanzar a aceptación si el turno válido no queda persistido o los rechazos crean filas.

### Entrega incremental

1. Extender con US2 y ejecutar pruebas SQL Server de secuencia, concurrencia, día local y formato.
2. Extender con US3 y validar asociación, opcionalidad, máximo de 100 caracteres y conservación al reiniciar.
3. Consolidar CE-001 a CE-005 y actualizar la matriz de trazabilidad solo con resultados observados.

## Validación del formato

Todas las tareas usan casilla `- [ ]`, identificador secuencial desde T001, etiqueta `[P]` solo cuando pueden ejecutarse en paralelo, etiqueta `[US1]`, `[US2]` o `[US3]` en fases de historia, descripción accionable, archivo/ruta de evidencia y criterio de aceptación relacionado.
