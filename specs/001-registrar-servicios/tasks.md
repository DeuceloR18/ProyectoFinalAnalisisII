# Tareas: Registrar y consultar servicios de atención (SPEC-01)

**Entrada**: documentos de diseño en `specs/001-registrar-servicios/`.

**Base de diseño**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md) y [quickstart.md](./quickstart.md).

**Criterios de aceptación**:

- **RF01-AT-01**: Registrar un servicio válido; aparece en la lista y se confirma.
- **RF01-AT-02**: Registrar el prefijo `c`; queda guardado y se muestra como `C`.
- **RF01-AT-03**: Rechazar nombre o prefijo vacío o solo con espacios, con mensaje y sin guardar.
- **RF01-AT-04**: Rechazar `c` si ya existe `C`, informar que está en uso y no guardar.
- **RF01-AT-05**: Rechazar nombre de más de 100 caracteres o prefijo de más de 5, informar y no guardar.
- **RF01-AT-06**: Consultar y mostrar todos los servicios con nombre y prefijo.
- **RF01-AT-07**: Mostrar claramente el estado de lista vacía.
- **RF01-AT-08**: Conservar los servicios al cerrar y volver a abrir la aplicación.

Las pruebas automatizadas deben producir resultados `.trx` en la carpeta de evidencia indicada; la aceptación manual debe conservar capturas de pantalla y una nota breve con resultado observado. No registrar secretos ni datos personales en la evidencia.

## Fase 1: Preparación de la solución

**Propósito**: Crear la solución y los proyectos por capas y de prueba previstos en `plan.md`.

- [ ] T001 Crear `ProyectoFinalAnalisisII.sln` y los proyectos `src/Servicio.Domain/Servicio.Domain.csproj`, `src/Servicio.Application/Servicio.Application.csproj`, `src/Servicio.Infrastructure/Servicio.Infrastructure.csproj` y `src/Servicio.Web/Servicio.Web.csproj` con destino `net10.0`; incorporar los cuatro proyectos a la solución. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08.
- [ ] T002 Configurar `src/Servicio.Domain/Servicio.Domain.csproj` sin referencias a otras capas; `src/Servicio.Application/Servicio.Application.csproj` con referencia a Domain; `src/Servicio.Infrastructure/Servicio.Infrastructure.csproj` con referencias a Application y Domain; y `src/Servicio.Web/Servicio.Web.csproj` con referencias a Application e Infrastructure. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08. **Depende de**: T001.
- [ ] T003 [P] Crear e incorporar a la solución `tests/Servicio.Domain.Tests/Servicio.Domain.Tests.csproj`, `tests/Servicio.Application.Tests/Servicio.Application.Tests.csproj` y `tests/Servicio.Web.Tests/Servicio.Web.Tests.csproj`, con xUnit y referencias a las capas que prueba; añadir `Microsoft.AspNetCore.Mvc.Testing` a las pruebas Web. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08. **Depende de**: T001.

## Fase 2: Fundamentos compartidos

**Propósito**: Preparar persistencia, configuración y arranque Web requeridos por ambas historias.

- [ ] T004 [P] Crear `src/Servicio.Infrastructure/Database/001-create-servicios.sql` para crear `dbo.Servicios` con `ServicioId INT IDENTITY(1,1)` como clave primaria, `Nombre NVARCHAR(100) NOT NULL`, `Prefijo NVARCHAR(5) NOT NULL` con colación `Latin1_General_100_CI_AS` y restricción o índice único `UX_Servicios_Prefijo`. **Criterios habilitados**: RF01-AT-01, RF01-AT-02, RF01-AT-04, RF01-AT-05, RF01-AT-06 y RF01-AT-08. **Depende de**: T001.
- [ ] T005 [P] Implementar la creación/configuración de conexiones SQL Server y el registro de dependencias en `src/Servicio.Infrastructure/DependencyInjection.cs`; leer la cadena de conexión desde configuración local/variable de entorno, sin incluir secretos en el repositorio. **Criterios habilitados**: RF01-AT-01, RF01-AT-04, RF01-AT-06 y RF01-AT-08. **Depende de**: T002.
- [ ] T006 Configurar en `src/Servicio.Web/Program.cs` el host ASP.NET Core, el servicio de páginas Razor en `/servicios`, el prefijo de ruta `/api/servicios`, Problem Details para errores API y la composición de dependencias de Application/Infrastructure. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08. **Depende de**: T002 y T005.
- [ ] T007 Crear `tests/Servicio.Web.Tests/ServiciosApiFactory.cs` para iniciar el host de prueba y usar únicamente la base SQL Server indicada por `SPEC01_SQLSERVER_CONNECTION`; asignar datos únicos por prueba, limpiar solo los registros creados por esa prueba y no borrar ni modificar bases ajenas. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08. **Depende de**: T003, T005 y T006.

**Punto de control**: los proyectos compilan, la solución inicia el host de prueba y la base de datos de prueba se puede preparar sin exponer secretos.

## Fase 3: Historia de usuario 1 — Registrar servicio (Prioridad: P1)

**Objetivo**: Registrar servicios válidos con prefijo normalizado y rechazar entradas inválidas o duplicadas sin cambiar los datos.

**Prueba independiente**: enviar solicitudes de alta válidas e inválidas, consultar después la colección y comprobar respuestas, mensajes, normalización y ausencia de altas rechazadas.

### Domain y Application — responsable: implementador de Domain/Application

- [ ] T008 [US1] Crear `tests/Servicio.Domain.Tests/ServicioTests.cs` con pruebas de recorte de espacios, rechazo de valores vacíos, aceptación de nombre de 100 y prefijo de 5 caracteres, rechazo de nombre de 101 y prefijo de 6, y normalización del prefijo a mayúsculas. **Criterios**: RF01-AT-02, RF01-AT-03 y RF01-AT-05. **Depende de**: T001 y T003.
- [ ] T009 [US1] Implementar `src/Servicio.Domain/Servicio.cs` con identificador, nombre y prefijo; aplicar las reglas de recorte, obligatoriedad, máximos de 100/5 caracteres y normalización invariante a mayúsculas sin depender de Web, Dapper ni SQL Server. **Criterios**: RF01-AT-01, RF01-AT-02, RF01-AT-03 y RF01-AT-05. **Depende de**: T008.
- [ ] T010 [US1] Crear en `src/Servicio.Application/Servicios/IServicioRepository.cs` el contrato de persistencia para comprobar la disponibilidad del prefijo, registrar un servicio y consultar todos los servicios; usar tipos de Domain y no exponer tipos de SQL Server. **Criterios habilitados**: RF01-AT-01 a RF01-AT-08. **Depende de**: T009.
- [ ] T011 [P] [US1] Crear `tests/Servicio.Application.Tests/RegistrarServicioTests.cs` con un repositorio de prueba y casos para alta válida, prefijo ya utilizado, entradas vacías y límites de longitud; comprobar que los rechazos no invocan el alta y que el duplicado devuelve el resultado de negocio definido. **Criterios**: RF01-AT-01, RF01-AT-03, RF01-AT-04 y RF01-AT-05. **Depende de**: T010.
- [ ] T012 [US1] Implementar `src/Servicio.Application/Servicios/RegistrarServicio.cs` para validar mediante Domain, consultar disponibilidad, persistir solo entradas válidas y devolver resultados diferenciados para validación, prefijo duplicado y alta satisfactoria. **Criterios**: RF01-AT-01, RF01-AT-02, RF01-AT-03, RF01-AT-04 y RF01-AT-05. **Depende de**: T009, T010 y T011.

### Infrastructure y base de datos — responsable: implementador de Infrastructure/SQL Server

- [ ] T013 [P] [US1] Crear `tests/Servicio.Web.Tests/Infrastructure/SqlServerServicioRepositoryTests.cs` con pruebas de integración contra la base SQL Server de prueba: guardar el prefijo canónico, rechazar una variante solo en mayúsculas y minúsculas mediante la unicidad de SQL Server y conservar los datos tras crear una nueva conexión. **Criterios**: RF01-AT-02, RF01-AT-04 y RF01-AT-08. **Depende de**: T004, T005, T007 y T010.
- [ ] T014 [US1] Implementar `src/Servicio.Infrastructure/Servicios/SqlServerServicioRepository.cs` con Dapper y consultas parametrizadas para comprobar el prefijo y registrar el servicio; traducir únicamente la violación de `UX_Servicios_Prefijo` al resultado de duplicado, y propagar otros fallos de persistencia como errores. **Criterios**: RF01-AT-01, RF01-AT-02 y RF01-AT-04. **Depende de**: T004, T005, T010 y T013.

### API — responsable: implementador de Web/API

- [ ] T015 [US1] Implementar `POST /api/servicios` en `src/Servicio.Web/Endpoints/ServiciosEndpoints.cs`, invocar `RegistrarServicio` y responder `201` con la representación creada, `400` con errores estructurados para entradas vacías o fuera de longitud y `409` con `prefijo_duplicado`; no ocultar fallos generales de persistencia como errores de validación. **Criterios**: RF01-AT-01 a RF01-AT-05. **Depende de**: T006, T012 y T014.
- [ ] T016 [US1] Crear `tests/Servicio.Web.Tests/Api/RegistrarServicioValidoTests.cs` para probar `POST /api/servicios` con datos válidos y comprobar respuesta de creación y persistencia; guardar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-01/pruebas.trx`. **Criterio**: RF01-AT-01. **Depende de**: T007 y T015.
- [ ] T017 [US1] Crear `tests/Servicio.Web.Tests/Api/PrefijoNormalizadoTests.cs` para enviar `prefijo: "c"`, comprobar que la respuesta y el registro posterior muestran `C`, y guardar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-02/pruebas.trx`. **Criterio**: RF01-AT-02. **Depende de**: T007 y T015.
- [ ] T018 [US1] Crear `tests/Servicio.Web.Tests/Api/ServicioDatosVaciosTests.cs` para probar nombre y prefijo vacíos o solo con espacios; verificar `400`, mensaje por campo y colección sin cambios, y guardar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-03/pruebas.trx`. **Criterio**: RF01-AT-03. **Depende de**: T007 y T015.
- [ ] T019 [US1] Crear `tests/Servicio.Web.Tests/Api/PrefijoDuplicadoTests.cs` para guardar `C` y después enviar `c`; verificar `409`, `prefijo_duplicado` y una sola fila en SQL Server, y guardar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-04/pruebas.trx`. **Criterio**: RF01-AT-04. **Depende de**: T007, T013, T014 y T015.
- [ ] T020 [US1] Crear `tests/Servicio.Web.Tests/Api/ServicioLongitudesMaximasTests.cs` para verificar que nombre de 101 caracteres y prefijo de 6 se rechazan con `400`, mientras que los máximos 100/5 son admisibles; comprobar que no se insertan las entradas rechazadas y guardar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-05/pruebas.trx`. **Criterio**: RF01-AT-05. **Depende de**: T007 y T015.

### Interfaz Web y UX — responsable: implementador de Web/UX

- [ ] T021 [US1] Crear `src/Servicio.Web/Pages/Servicios/Index.cshtml` y `src/Servicio.Web/wwwroot/js/servicios.js` para ofrecer el formulario de alta, llamar al endpoint POST del mismo origen, mostrar la confirmación y reflejar el servicio recién registrado; incluir etiquetas asociadas a los campos y operación por teclado. **Criterios**: RF01-AT-01 y RF01-AT-02. **Depende de**: T015.
- [ ] T022 [US1] Ejecutar aceptación manual de RF01-AT-01 en `/servicios`; capturar formulario, confirmación y servicio en la lista en `specs/001-registrar-servicios/evidence/RF01-AT-01/interfaz.png` y registrar resultado y revisión en `resultado.md`. **Criterio**: RF01-AT-01. **Depende de**: T021.
- [ ] T023 [US1] Ejecutar aceptación manual de RF01-AT-02 con el prefijo `c`; capturar el prefijo presentado como `C` en `specs/001-registrar-servicios/evidence/RF01-AT-02/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-02. **Depende de**: T021.
- [ ] T024 [US1] Ejecutar aceptación manual de RF01-AT-03 con nombre y prefijo vacíos o compuestos solo por espacios; capturar mensaje claro y lista sin cambios en `specs/001-registrar-servicios/evidence/RF01-AT-03/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-03. **Depende de**: T021.
- [ ] T025 [US1] Ejecutar aceptación manual de RF01-AT-04 intentando registrar `c` cuando existe `C`; capturar el mensaje de prefijo en uso y lista sin duplicado en `specs/001-registrar-servicios/evidence/RF01-AT-04/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-04. **Depende de**: T021.
- [ ] T026 [US1] Ejecutar aceptación manual de RF01-AT-05 con nombre de 101 caracteres y prefijo de 6; capturar cada mensaje y verificar que el listado no cambió en `specs/001-registrar-servicios/evidence/RF01-AT-05/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-05. **Depende de**: T021.

**Punto de control US1**: pasan pruebas Domain, Application, API y SQL Server; están disponibles las capturas de los cinco criterios de registro y cada rechazo deja los datos intactos.

## Fase 4: Historia de usuario 2 — Consultar servicios registrados (Prioridad: P1)

**Objetivo**: Consultar todos los servicios en orden determinista, distinguir lista vacía de error y comprobar persistencia tras reiniciar.

**Prueba independiente**: cargar varios servicios y consultar la API y la interfaz; probar una colección vacía; reiniciar el host conservando la base SQL Server y consultar de nuevo.

### Domain y Application — responsable: implementador de Application

- [ ] T027 [P] [US2] Crear `tests/Servicio.Application.Tests/ConsultarServiciosTests.cs` con casos de colección vacía y con varios servicios, verificando que el caso de uso delega al repositorio y conserva el orden recibido. **Criterios**: RF01-AT-06 y RF01-AT-07. **Depende de**: T010.
- [ ] T028 [US2] Implementar `src/Servicio.Application/Servicios/ConsultarServicios.cs` para devolver la colección de `IServicioRepository` sin trasladar decisiones de transporte ni de SQL Server a Application. **Criterios**: RF01-AT-06 y RF01-AT-07. **Depende de**: T027.

### Infrastructure y base de datos — responsable: implementador de Infrastructure/SQL Server

- [ ] T029 [US2] Implementar la consulta de listado ordenado por prefijo y `ServicioId` en `src/Servicio.Infrastructure/Servicios/SqlServerServicioRepository.cs`; ampliar `tests/Servicio.Web.Tests/Infrastructure/SqlServerServicioRepositoryTests.cs` para verificar datos y orden en SQL Server. **Criterios**: RF01-AT-06 y RF01-AT-08. **Depende de**: T014 y T028.

### API — responsable: implementador de Web/API

- [ ] T030 [US2] Implementar `GET /api/servicios` en `src/Servicio.Web/Endpoints/ServiciosEndpoints.cs`, conectándolo a `ConsultarServicios`; responder `200` con todos los servicios y con `[]` cuando no existan registros. **Criterios**: RF01-AT-06 y RF01-AT-07. **Depende de**: T015, T028 y T029.
- [ ] T031 [US2] Crear `tests/Servicio.Web.Tests/Api/ConsultarServiciosRegistradosTests.cs` para verificar que GET devuelve cada servicio con su nombre y prefijo; conservar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-06/pruebas.trx`. **Criterio**: RF01-AT-06. **Depende de**: T007 y T030.
- [ ] T032 [US2] Crear `tests/Servicio.Web.Tests/Api/ConsultarServiciosVaciosTests.cs` para verificar que GET devuelve `200` y `[]` con la base de prueba vacía; conservar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-07/pruebas.trx`. **Criterio**: RF01-AT-07. **Depende de**: T007 y T030.
- [ ] T033 [US2] Crear `tests/Servicio.Web.Tests/Api/ServiciosPersistenTrasReinicioTests.cs` para registrar datos, crear una nueva instancia del host con la misma base SQL Server y comprobar que GET conserva los datos; conservar el resultado en `specs/001-registrar-servicios/evidence/RF01-AT-08/pruebas.trx`. **Criterio**: RF01-AT-08. **Depende de**: T007, T014, T029 y T030.

### Interfaz Web y UX — responsable: implementador de Web/UX

- [ ] T034 [US2] Completar `src/Servicio.Web/Pages/Servicios/Index.cshtml` y `src/Servicio.Web/wwwroot/js/servicios.js` para mostrar el nombre y prefijo de todos los servicios, mantener un orden estable y presentar un estado vacío comprensible sin apariencia de error. **Criterios**: RF01-AT-06 y RF01-AT-07. **Depende de**: T021 y T030.
- [ ] T035 [US2] Ejecutar aceptación manual de RF01-AT-06 con varios servicios; capturar la lista completa con nombres y prefijos en `specs/001-registrar-servicios/evidence/RF01-AT-06/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-06. **Depende de**: T034.
- [ ] T036 [US2] Ejecutar aceptación manual de RF01-AT-07 sin servicios registrados; capturar el estado vacío comprensible en `specs/001-registrar-servicios/evidence/RF01-AT-07/interfaz.png` y registrar resultado en `resultado.md`. **Criterio**: RF01-AT-07. **Depende de**: T034.
- [ ] T037 [US2] Ejecutar aceptación manual de RF01-AT-08: registrar un servicio, cerrar y reiniciar la aplicación sin borrar la base, y consultar la lista; guardar captura en `specs/001-registrar-servicios/evidence/RF01-AT-08/interfaz.png` y resultado en `resultado.md`. **Criterio**: RF01-AT-08. **Depende de**: T034.

**Punto de control US2**: GET devuelve colecciones pobladas y vacías como se especifica, la interfaz diferencia el estado vacío y los datos sobreviven a la recreación del host.

## Fase 5: Pulido y trazabilidad final

**Propósito**: Vincular los resultados de implementación y aceptación con SPEC-01.

- [ ] T038 Actualizar la matriz de criterios de aceptación y pruebas en `specs/001-registrar-servicios/plan.md` para enlazar RF01-AT-01 a RF01-AT-08 con sus pruebas automatizadas `.trx`, capturas `interfaz.png` y notas `resultado.md`; consignar el resultado efectivamente obtenido sin marcar como aprobada ninguna prueba pendiente. **Criterios**: RF01-AT-01 a RF01-AT-08. **Depende de**: T016 a T026, T031 a T037.

## Dependencias y orden de ejecución

### Dependencias entre fases

- Fase 1 precede a la Fase 2.
- La Fase 2 es requisito para ambas historias.
- US1 y US2 tienen prioridad P1. US2 puede preparar sus pruebas de Application después del contrato compartido T010; su implementación de consulta requiere el repositorio SQL Server de T014 y el host/endpoints compartidos. No requiere completar las capturas manuales de US1.
- La actualización de trazabilidad T038 es el último paso y depende de las pruebas y evidencias de ambas historias.

### Dependencias principales entre tareas

```text
T001 → T002, T003, T004
T002 → T005, T006
T003 + T005 + T006 → T007
T008 → T009 → T010 → T011 → T012
T004 + T005 + T007 + T010 → T013 → T014
T006 + T012 + T014 → T015 → T016–T026
T010 → T027 → T028
T014 + T028 → T029 → T030 → T031–T037
T021 + T030 → T034
T016–T026 + T031–T037 → T038
```

### Oportunidades de paralelismo

- Tras T001, T003 puede avanzarse en paralelo con T002; T004 puede prepararse en paralelo con la configuración de proyectos.
- Tras T002, T004 y T005 pueden desarrollarse en paralelo; T006 comienza una vez configurado el registro de dependencias en T005.
- En US1, T011 y T013 son pruebas de proyectos distintos y pueden prepararse en paralelo después de T010 y de los fundamentos SQL; T016–T020 usan archivos de prueba independientes, pero sus ejecuciones contra SQL Server deben serializarse si comparten la base de prueba.
- Las aceptaciones manuales T022–T026 y T035–T037 usan una base mutable; realizar una a la vez o restablecerla entre escenarios, aunque las tareas pueden asignarse a responsables distintos.
- Tras T030 y T034, T031–T033 tienen archivos independientes, pero ejecutar secuencialmente contra la base compartida salvo que cada prueba tenga una base aislada.
- Las marcas `[P]` aparecen solo en tareas con archivos de salida separados y sin dependencia de una tarea incompleta distinta de sus prerrequisitos declarados.

## Estrategia de implementación

### MVP sugerido

1. Completar preparación y fundamentos (T001–T007).
2. Completar US1 (T008–T026), incluida la verificación de límites: nombre máximo 100 y prefijo máximo 5.
3. Detenerse y validar RF01-AT-01 a RF01-AT-05 en Domain, Application, API, SQL Server y aceptación manual.
4. Completar US2 (T027–T037) para lectura, lista vacía y persistencia tras reinicio.
5. Ejecutar T038 solo después de recopilar y revisar los resultados y capturas.

### Entrega incremental

- Fase 1 y Fase 2 dejan disponible la estructura por capas y el entorno de prueba.
- US1 entrega el alta y sus validaciones como incremento utilizable.
- US2 agrega consulta completa, estado vacío y verificación de persistencia.
- La entrega no incluye edición, eliminación, usuarios, roles ni pantallas públicas.
