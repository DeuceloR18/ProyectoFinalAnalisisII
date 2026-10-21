# Tareas: Consultar fila de espera (SPEC-03)

**Entrada**: documentos de diseño en `specs/003-consultar-fila-espera/`.

**Documentos base**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md) y [quickstart.md](./quickstart.md).

**Responsables**:

- Domain y Application: Persona 2.
- Infrastructure, base de datos y API: Persona 3.
- Interfaz web y UX: Persona 4.

**Dependencias externas — implementar en las especificaciones originales, no duplicar aquí**:

- Solución, proyectos y pruebas compartidos: `specs/001-registrar-servicios/tasks.md`, T001-T003.
- SQL Server, tabla de servicios, conexión y host Web/API: `specs/001-registrar-servicios/tasks.md`, T004-T007.
- Contrato y repositorio de servicios más interfaz API: `specs/001-registrar-servicios/tasks.md`, T010, T014 y T030.
- Servicios existentes para las pruebas y selector web: alta/listado de SPEC-01; la lista debe estar disponible antes de validar la fila.
- Tabla y columnas `dbo.Turnos`, mecanismo de generación y fixture SQL Server: `specs/002-generar-turno/tasks.md`, T001-T003.
- Caso de uso/repositorio/API de generación y página de servicios integrada: SPEC-02 T007, T011-T013; se usan para preparar turnos de prueba y volver a consultar, no se reimplementan.
- Toda prueba que dependa de estos prerequisitos debe bloquearse hasta completar las tareas referenciadas en SPEC-01/SPEC-02. Los identificadores se entienden con la ruta de especificación indicada, pues se reinician por spec.

**Evidencia**: Guardar resultados `.trx`, capturas y notas en `specs/003-consultar-fila-espera/evidence/RF03-AT-XX/` o `evidence/CE-XXX/`. Usar una base SQL Server de prueba aislada y datos ficticios.

## Fase 1: Preparación

La solución, los proyectos por capas, xUnit, SQL Server/Dapper, host Web y configuración común se reutilizan de SPEC-01. No hay tareas nuevas de inicialización.

## Fase 2: Fundamento compartido

**Propósito**: Añadir el índice de lectura que usan las historias. Los servicios y turnos deben estar disponibles según los prerequisitos externos.

### Infrastructure y base de datos — responsable: Persona 3

- [ ] T001 Crear `src/Servicio.Infrastructure/Database/003-index-fila-espera.sql` con el índice no clúster `IX_Turnos_FilaEspera` en `dbo.Turnos`, claves `(ServicioId, Estado, FechaTurno, FechaHoraGeneracion, Correlativo)` e inclusión de `(NumeroTurno, NombreCliente)`; hacer que el script pueda aplicarse al esquema creado por SPEC-02 sin modificar registros. **Criterios habilitados**: RF03-AT-01 a RF03-AT-08. **Depende de**: `specs/002-generar-turno/tasks.md` T001 y T002.
- [ ] T002 Crear o ampliar `tests/Servicio.Web.Tests/Infrastructure/FilaEsperaSqlServerFixture.cs` para usar la base indicada por `SPEC02_SQLSERVER_CONNECTION`, cargar datos aislados para consultas y limpiar solo los datos creados por cada prueba; verificar que el índice de SPEC-03 está aplicado y no usar una base productiva. **Criterios habilitados**: RF03-AT-01 a RF03-AT-08 y RF03-AT-10. **Depende de**: T001; `specs/001-registrar-servicios/tasks.md` T003, T005 y T007; `specs/002-generar-turno/tasks.md` T003.

## Fase 3: Historia de usuario 1 — Consultar y presentar la fila (Prioridad: P1)

**Objetivo**: Consultar los turnos elegibles de un servicio y devolver orden, posiciones, números, nombres opcionales y total.

**Prueba independiente**: Con servicios y turnos preparados mediante SPEC-01/SPEC-02, consultar la ruta de fila y verificar posición desde 1, orden cronológico y total coincidente.

### Domain y Application — responsable: Persona 2

- [ ] T003 [P] [US1] Crear `tests/Servicio.Application.Tests/ConsultarFilaEsperaTests.cs` para verificar que el caso de uso delega el servicio elegido al repositorio, devuelve elementos y total, y no transforma los datos de turno; guardar el `.trx` en `specs/003-consultar-fila-espera/evidence/RF03-AT-01/pruebas-aplicacion.trx`. **Criterios**: RF03-AT-01 y RF03-AT-02. **Depende de**: `specs/001-registrar-servicios/tasks.md` T003 y T010; `specs/002-generar-turno/tasks.md` T007.
- [ ] T004 [US1] Definir en `src/Servicio.Application/FilaEspera/IFilaEsperaRepository.cs` el contrato de lectura por `servicioId` y los modelos de respuesta con elementos `(Posicion, NumeroTurno, NombreCliente)` y `TotalEnEspera`; no agregar entidades persistentes ni exponer tipos Dapper/SQL. **Criterios habilitados**: RF03-AT-01 a RF03-AT-10. **Depende de**: T003 y `specs/001-registrar-servicios/tasks.md` T010.
- [ ] T005 [US1] Implementar `src/Servicio.Application/FilaEspera/ConsultarFilaEspera.cs` para solicitar la fila al repositorio y devolver resultados, cero elementos y servicio inexistente como resultados diferenciados; mantener el caso de uso de solo lectura y no calcular posiciones fuera de la consulta definida en Infrastructure. **Criterios**: RF03-AT-01, RF03-AT-08 y RF03-AT-09. **Depende de**: T004.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T006 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/SqlServerFilaOrdenYProyeccionTests.cs` con turnos de horas distintas, correlativos y nombres presentes/ausentes; verificar orden, desempate numérico, posiciones consecutivas, campos proyectados y total. Guardar resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-01/pruebas-sql.trx`, `RF03-AT-02/pruebas-sql.trx` y `RF03-AT-03/pruebas-sql.trx`. **Criterios**: RF03-AT-01, RF03-AT-02 y RF03-AT-03. **Depende de**: T002, `specs/001-registrar-servicios/tasks.md` T004 y `specs/002-generar-turno/tasks.md` T001-T003.
- [ ] T007 [P] [US1] Crear `tests/Servicio.Web.Tests/Api/ConsultarFilaEsperaContratoTests.cs` para verificar la ruta `GET /api/servicios/{servicioId}/fila-espera`, el estado `200` y el JSON con total, posiciones, números y nombre nullable; conservar resultados por criterio en `specs/003-consultar-fila-espera/evidence/RF03-AT-01/` a `RF03-AT-03/`. **Criterios**: RF03-AT-01 a RF03-AT-03. **Depende de**: `specs/001-registrar-servicios/tasks.md` T007; `specs/002-generar-turno/tasks.md` T003.
- [ ] T008 [US1] Implementar `src/Servicio.Infrastructure/FilaEspera/SqlServerFilaEsperaRepository.cs` con Dapper y una consulta de solo lectura que distinga servicio existente, filtre por servicio/estado/fecha de servidor, calcule `ROW_NUMBER()` y total, proyecte nombre nullable y ordene por fecha/hora y correlativo numérico; no ejecutar escritura ni persistir posiciones. **Criterios**: RF03-AT-01 a RF03-AT-08 y RF03-AT-10. **Depende de**: T001-T006 y T004.
- [ ] T009 [US1] Implementar `src/Servicio.Web/Endpoints/FilaEsperaEndpoints.cs` con `GET /api/servicios/{servicioId}/fila-espera`; responder `200` para servicio existente incluso con lista vacía, `404` para servicio inexistente y no agregar fecha ni filtros de consulta no definidos. **Criterios**: RF03-AT-01 a RF03-AT-08. **Depende de**: T005, T008 y `specs/001-registrar-servicios/tasks.md` T006.

### Interfaz web y UX — responsable: Persona 4

- [ ] T010 [US1] Implementar `src/Servicio.Web/Pages/FilaEspera/Index.cshtml` y `src/Servicio.Web/wwwroot/js/fila-espera.js` para cargar la selección desde `GET /api/servicios`, consultar el endpoint de fila del mismo origen y mostrar posición, número, nombre si existe y total; usar etiquetas accesibles y navegación por teclado. **Criterios**: RF03-AT-01 a RF03-AT-04. **Depende de**: T009 y `specs/001-registrar-servicios/tasks.md` T030.
- [ ] T011 [P] [US1] Ejecutar aceptación manual de RF03-AT-01 y RF03-AT-02 con varios turnos de horas distintas; verificar presentación en orden, posiciones 1 y 2, números y total. Guardar capturas y resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-01/interfaz.png`, `RF03-AT-01/resultado.md` y `RF03-AT-02/`. **Criterios**: RF03-AT-01 y RF03-AT-02. **Depende de**: T010 y T006.
- [ ] T012 [P] [US1] Ejecutar aceptación manual de RF03-AT-03 con un turno nombrado y otro sin nombre; comprobar que el nombre acompaña solo al turno correspondiente y que el otro muestra únicamente número. Guardar captura y resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-03/interfaz.png` y `resultado.md`. **Criterio**: RF03-AT-03. **Depende de**: T010 y T006.
- [ ] T013 [P] [US1] Ejecutar aceptación manual de RF03-AT-04: consultar la fila, generar un turno elegible usando el flujo de SPEC-02, volver a consultar y verificar que aparece en la posición final con total incrementado en uno. Guardar capturas/resultados antes y después en `specs/003-consultar-fila-espera/evidence/RF03-AT-04/`. **Criterio**: RF03-AT-04. **Depende de**: T010 y `specs/002-generar-turno/tasks.md` T012-T013.

## Fase 4: Historia de usuario 2 — Mostrar únicamente turnos elegibles (Prioridad: P1)

**Objetivo**: Limitar la fila al servicio consultado, estado «Esperando» y fecha local actual del servidor, y presentar correctamente una fila vacía.

**Prueba independiente**: Preparar registros con varios servicios, estados y días; verificar que solo los elegibles aparecen y que la fila vacía devuelve cero con mensaje claro.

### Domain y Application — responsable: Persona 2

- [ ] T014 [P] [US2] Ampliar `tests/Servicio.Application.Tests/ConsultarFilaEsperaTests.cs` para comprobar que servicio inexistente se comunica como no encontrado y una respuesta válida vacía se conserva como total cero/lista vacía; guardar el `.trx` en `specs/003-consultar-fila-espera/evidence/RF03-AT-08/pruebas-aplicacion.trx`. **Criterios**: RF03-AT-08 y RF03-AT-09. **Depende de**: T005.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T015 [P] [US2] Crear `tests/Servicio.Web.Tests/Infrastructure/SqlServerFilaFiltrosTests.cs` con registros del mismo servicio en estados «Esperando», «En atención», «Finalizado» y «Cancelado», de otro servicio y de días actual/anterior; verificar exclusiones e inclusión exactas en elementos y total. Guardar resultados en `specs/003-consultar-fila-espera/evidence/RF03-AT-05/pruebas-sql.trx`, `RF03-AT-06/pruebas-sql.trx` y `RF03-AT-07/pruebas-sql.trx`. **Criterios**: RF03-AT-05, RF03-AT-06 y RF03-AT-07. **Depende de**: T002 y T008.
- [ ] T016 [P] [US2] Crear `tests/Servicio.Web.Tests/Api/FilaEsperaVaciaYServicioInexistenteTests.cs` para comprobar `200`, total 0 y elementos vacíos en servicio existente sin turnos elegibles, y `404` para identificador de servicio inexistente; guardar `.trx` en `specs/003-consultar-fila-espera/evidence/RF03-AT-08/pruebas-api.trx`. **Criterio**: RF03-AT-08. **Depende de**: T009 y `specs/001-registrar-servicios/tasks.md` T007.

### Interfaz web y UX — responsable: Persona 4

- [ ] T017 [US2] Actualizar `src/Servicio.Web/Pages/FilaEspera/Index.cshtml` y `src/Servicio.Web/wwwroot/js/fila-espera.js` para mostrar una fila vacía con total 0 y mensaje informativo normal; mantener las filas recibidas aisladas al servicio elegido y reflejar cada nueva consulta sin afirmar actualización automática. **Criterios**: RF03-AT-04 y RF03-AT-08. **Depende de**: T010 y T016.
- [ ] T018 [P] [US2] Ejecutar aceptación manual de RF03-AT-05 a RF03-AT-07 con datos de prueba que cubran estados excluidos, otro servicio y día anterior; comprobar que no se muestran ni cuentan y guardar capturas/notas en `specs/003-consultar-fila-espera/evidence/RF03-AT-05/`, `RF03-AT-06/` y `RF03-AT-07/`. **Criterios**: RF03-AT-05, RF03-AT-06 y RF03-AT-07. **Depende de**: T017 y T015.
- [ ] T019 [P] [US2] Ejecutar aceptación manual de RF03-AT-08 con un servicio válido sin turnos elegibles; comprobar total 0 y mensaje claro sin apariencia de error, y guardar captura/resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-08/interfaz.png` y `resultado.md`. **Criterio**: RF03-AT-08. **Depende de**: T017 y T016.

## Fase 5: Historia de usuario 3 — Consultar sin alterar información (Prioridad: P1)

**Objetivo**: Solicitar selección si no se eligió servicio y asegurar que la consulta no modifica ningún dato de turnos.

**Prueba independiente**: Intentar consultar sin selección, confirmar que no se presenta una fila previa y comparar una instantánea de los datos antes y después de consultas repetidas.

### Domain y Application — responsable: Persona 2

- [ ] T020 [P] [US3] Ampliar `tests/Servicio.Application.Tests/ConsultarFilaEsperaTests.cs` para probar consultas repetidas con resultado idéntico cuando el repositorio no cambia, sin mutar objetos de turno; guardar resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-10/pruebas-aplicacion.trx`. **Criterio**: RF03-AT-10. **Depende de**: T005.

### Infrastructure, base de datos y API — responsable: Persona 3

- [ ] T021 [P] [US3] Crear `tests/Servicio.Web.Tests/Infrastructure/ConsultaFilaSoloLecturaTests.cs` para guardar una instantánea de `ServicioId`, `NumeroTurno`, `Estado`, `FechaTurno`, `FechaHoraGeneracion` y `NombreCliente`, ejecutar consultas repetidas y comprobar que todos los valores persistidos siguen iguales; guardar el `.trx` en `specs/003-consultar-fila-espera/evidence/RF03-AT-10/pruebas-solo-lectura.trx`. **Criterio**: RF03-AT-10. **Depende de**: T002 y T008.

### Interfaz web y UX — responsable: Persona 4

- [ ] T022 [US3] Actualizar `src/Servicio.Web/wwwroot/js/fila-espera.js` para que, sin servicio seleccionado, solicite selección, no llame a `GET /api/servicios/{servicioId}/fila-espera` y limpie/oculte cualquier fila anterior; conservar accesibilidad por teclado. **Criterio**: RF03-AT-09. **Depende de**: T010.
- [ ] T023 [P] [US3] Crear `tests/Servicio.Web.Tests/Ui/FilaEsperaSinSeleccionTests.cs` para verificar que al iniciar o limpiar la selección se muestra la indicación, no se envía una solicitud de fila y no se muestran turnos previos; conservar resultado/captura en `specs/003-consultar-fila-espera/evidence/RF03-AT-09/`. **Criterio**: RF03-AT-09. **Depende de**: T022.
- [ ] T024 [P] [US3] Ejecutar aceptación manual de RF03-AT-09 y RF03-AT-10; comprobar en interfaz la solicitud de selección y verificar antes/después que consultar repetidamente no cambia la información persistida. Guardar capturas, consulta de verificación y notas en `specs/003-consultar-fila-espera/evidence/RF03-AT-09/` y `RF03-AT-10/`. **Criterios**: RF03-AT-09 y RF03-AT-10. **Depende de**: T021-T023.

## Fase 6: Evidencia de criterios de éxito y trazabilidad final

**Propósito**: Consolidar evidencia observada para cada criterio de éxito y actualizar la matriz del plan.

### Consolidación de evidencia — responsables de las capas verificadas

- [ ] T025 [P] Consolidar para CE-001 las evidencias de orden, unicidad de elementos y orden cronológico de RF03-AT-01, RF03-AT-02, RF03-AT-04 y RF03-AT-07 en `specs/003-consultar-fila-espera/evidence/CE-001/resultado.md`; adjuntar resultados y capturas con los conteos verificados. **Criterio**: CE-001. **Responsables**: Personas 3 y 4. **Depende de**: T006, T011, T013, T015 y T018.
- [ ] T026 [P] Consolidar para CE-002 la comparación entre total y número de elementos, incluyendo el caso vacío, a partir de RF03-AT-01, RF03-AT-04 y RF03-AT-08; guardar la síntesis y evidencias en `specs/003-consultar-fila-espera/evidence/CE-002/resultado.md`. **Criterio**: CE-002. **Responsables**: Personas 3 y 4. **Depende de**: T006, T013, T016 y T019.
- [ ] T027 [P] Consolidar para CE-003 la comprobación de exclusión por servicio, día y estado de RF03-AT-05 a RF03-AT-07 en `specs/003-consultar-fila-espera/evidence/CE-003/resultado.md`; adjuntar `.trx` y capturas, indicando casos realmente ejecutados. **Criterio**: CE-003. **Responsables**: Personas 3 y 4. **Depende de**: T015 y T018.
- [ ] T028 [P] Consolidar para CE-004 la comparación de datos anterior/posterior de RF03-AT-10 en `specs/003-consultar-fila-espera/evidence/CE-004/resultado.md`; adjuntar prueba de SQL Server y verificación manual. **Criterio**: CE-004. **Responsables**: Personas 2, 3 y 4 según la prueba. **Depende de**: T020, T021 y T024.
- [ ] T029 [P] Ejecutar aceptación cronometrada para CE-005 desde seleccionar un servicio hasta identificar quién sigue; registrar tiempo observado, contexto de prueba y captura en `specs/003-consultar-fila-espera/evidence/CE-005/resultado.md`. **Criterio**: CE-005. **Responsable**: Persona 4. **Depende de**: T010 y T011.

### Cierre — responsables: Personas 2, 3 y 4

- [ ] T030 Actualizar la matriz de aceptación en `specs/003-consultar-fila-espera/plan.md` para enlazar RF03-AT-01 a RF03-AT-10 y CE-001 a CE-005 con las pruebas, archivos `.trx`, capturas y rutas de evidencia T003-T029; registrar solo resultados efectivamente observados y dejar explícitamente pendientes las pruebas no ejecutadas. **Criterios**: RF03-AT-01 a RF03-AT-10 y CE-001 a CE-005. **Depende de**: T003-T029.

## Dependencias y orden de ejecución

### Dependencias externas de SPEC-01 y SPEC-02

- Antes de SPEC-03 deben completarse las tareas citadas en `specs/001-registrar-servicios/tasks.md` para proyectos, servicios, conexión, host, repositorio y `GET /api/servicios`; de lo contrario, no existe selector ni servicio persistido para consultar.
- Deben completarse `specs/002-generar-turno/tasks.md` T001-T003 para tablas/fixture y T007/T011-T013 para que el modelo de turnos, la generación y sus datos sean disponibles en la prueba integrada.
- SPEC-03 consume servicios y turnos; no vuelve a implementar su registro, consulta, generación, persistencia ni transiciones.

### Dependencias entre fases e historias

- Fase 2 depende del esquema persistente de SPEC-02. T002 depende de los proyectos y fixtures ya creados en las dependencias externas.
- US1 depende de la Fase 2 y del contrato de servicios/turnos de SPEC-01/SPEC-02; establece la proyección, consulta de repositorio, API y pantalla.
- US2 depende de la consulta implementada en US1; añade verificación específica de filtros y presentación de fila vacía.
- US3 depende de la pantalla y consulta de US1; verifica ausencia de selección y carácter de solo lectura.
- T030 es la tarea final y depende de las pruebas y evidencias de todas las historias.

### Oportunidades de paralelismo

- Tras estar disponible el esquema SPEC-02, aplicar primero el índice T001 y después preparar el fixture T002 para verificarlo sobre la base aislada.
- En US1, T003 puede desarrollarse en paralelo con T006 y T007, pues afectan a proyectos/archivos de prueba distintos; T008 y T009 esperan contratos/caso de uso. Las aceptaciones manuales T011-T013 son independientes una vez lista la pantalla y sus datos específicos.
- En US2, T014-T016 son pruebas separadas por capa/archivo; T018 y T019 son aceptaciones independientes al completar el ajuste de fila vacía.
- En US3, T020, T021 y T023 verifican capas/archivos distintos y pueden prepararse tras existir sus interfaces; T024 depende de las pruebas y la pantalla.
- Las consolidaciones T025-T029 pueden realizarse en paralelo tras sus pruebas de origen. T030 no es paralelizable: cierra la matriz cuando todas las evidencias estén disponibles.

## Estrategia de implementación

### MVP recomendado: Historia de usuario 1

1. Completar prerequisitos de SPEC-01 y SPEC-02, y aplicar el índice de SPEC-03.
2. Completar US1: modelo de lectura/caso de uso, repositorio SQL Server, endpoint y pantalla para un servicio.
3. Validar RF03-AT-01 a RF03-AT-04 con SQL Server y aceptación manual, guardando evidencia antes de avanzar.

### Entrega incremental

1. Completar US2 y validar RF03-AT-05 a RF03-AT-08, incluyendo la fila vacía.
2. Completar US3 y validar RF03-AT-09 y RF03-AT-10, incluyendo comparación de datos antes/después.
3. Consolidar CE-001 a CE-005 y actualizar la trazabilidad solo a partir de resultados reales.

## Validación del formato

Todas las tareas usan casilla `- [ ]`, IDs secuenciales desde T001, `[P]` solo para trabajo paralelizable, etiqueta de historia en fases US, descripción accionable con rutas de archivos y criterios de aceptación relacionados. Las tareas de prueba identifican evidencia a guardar y responsable de la capa que verifican.
