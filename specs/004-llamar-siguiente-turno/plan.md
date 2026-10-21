# Plan de implementación: Llamar siguiente turno

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md) (SPEC-04)

**Entrada**: [spec.md](./spec.md)

## Resumen

Permitir llamar automáticamente al turno «Esperando» más antiguo del servicio seleccionado para el día local actual, cambiarlo a «En atención» y persistir la fecha/hora del llamado. Una transacción con bloqueo exclusivo por servicio serializa llamados simultáneos; un índice único filtrado en SQL Server garantiza como última defensa un solo turno «En atención» por servicio, incluso si se generó en otro día. También se agrega la consulta de turno actual, que muestra «Ninguno» cuando no existe.

## Contexto técnico

La arquitectura, la plataforma y los proyectos se heredan de [SPEC-01](../001-registrar-servicios/plan.md). El modelo de turnos y la generación se heredan de [SPEC-02](../002-generar-turno/plan.md); la consulta de la fila se integra según [SPEC-03](../003-consultar-fila-espera/plan.md). Este plan describe solo el llamado y la lectura del turno actual.

**Lenguaje y versión**: Sin cambios respecto a SPEC-01.

**Dependencias principales**: Sin paquetes nuevos; reutilizar ASP.NET Core, Dapper, SQL Server y xUnit definidos en SPEC-01.

**Almacenamiento**: Ampliar `dbo.Turnos` con `FechaHoraLlamado DATETIMEOFFSET(7) NULL`; agregar índice único filtrado por `ServicioId` para registros con estado «En atención».

**Pruebas**: xUnit para la transición Domain y el caso de uso; pruebas HTTP/API; pruebas de integración sobre SQL Server real para el bloqueo, el índice, persistencia y concurrencia; aceptación manual con capturas.

**Plataforma y proyectos**: Aplicación ASP.NET Core existente con proyectos `Servicio.Domain`, `Servicio.Application`, `Servicio.Infrastructure` y `Servicio.Web`; no crear proyectos.

**Restricciones**: Solo transición `Esperando` → `En atención`; el turno se elige automáticamente. El estado activo se verifica por servicio sin filtrar por día. No se implementan finalizar, cancelar, selección manual, altavoz, pantallas públicas ni notificaciones.

**Dependencias funcionales**: Se requieren servicios de SPEC-01, turnos de SPEC-02 y disponibilidad de la fila de SPEC-03. Sus funciones se consumen, no se vuelven a implementar.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-04 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | Diseño basado en SPEC-04 y las dependencias declaradas. |
| Trazabilidad | Cumple | Cada escenario RF04-AT y criterio de éxito CE se vincula a prueba y evidencia. |
| Criterios verificables | Cumple | Los diez escenarios y seis criterios de éxito tienen pruebas propuestas. |
| Arquitectura en capas | Cumple | Domain valida transición; Application coordina el caso de uso; Infrastructure ejecuta SQL; Web expone API e interfaz. |
| Alcance mínimo viable | Cumple | No se agrega finalización ni ninguna transición fuera del alcance. |
| Pruebas con evidencia | Cumple | Pruebas Domain/Application, HTTP, SQL Server concurrente y aceptación manual. |
| UX clara y accesible | Cumple | Se comunican selección requerida, ausencia de espera y atención activa; «Ninguno» identifica falta de turno actual. |
| Uso responsable de IA | Cumple | Los cambios asistidos serán revisados y validados por el equipo. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta únicamente en español por instrucción expresa. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`; no se cambia ni crea ninguna rama. |

**Resultado de las puertas**: las reglas de transición, selección, exclusión mutua, persistencia y turno actual están definidas en SPEC-04 y en las decisiones técnicas del usuario. Los contratos diferencian los rechazos previstos sin agregar operaciones de negocio.

## Diseño específico por capa

### Domain

- Ampliar `Turno` con `FechaHoraLlamado` nullable.
- Exponer una operación de dominio para pasar a «En atención» que recibe la marca temporal y permite exclusivamente el estado de origen «Esperando». Si el estado es distinto, rechaza la transición sin cambiar el objeto.
- No permitir que Web o el cliente elijan qué turno se llama; Domain valida la transición, no la selección de transporte.
- No agregar transición de salida de «En atención».

### Application

- Agregar el caso de uso `LlamarSiguienteTurno` por `ServicioId`; coordina la solicitud sin aceptar `TurnoId` ni `FechaHoraLlamado` suministrados por el cliente.
- Declarar contratos de Application para llamada atómica y consulta del turno actual.
- Diferenciar servicio inexistente, ausencia de turnos elegibles y turno ya activo. Rechazos de negocio no cambian los datos; fallos técnicos se propagan explícitamente.
- Agregar `ConsultarTurnoActual` por servicio; devolver el registro activo si existe y un resultado vacío si no existe. No limitar esta lectura a la fecha actual.
- Application no calcula ni persiste una fila alternativa; el repositorio toma la decisión atómica usando los datos ya definidos en SPEC-02/03.

### Infrastructure y base de datos

- Agregar script versionado en `Servicio.Infrastructure/Database` para `FechaHoraLlamado DATETIMEOFFSET(7) NULL` e índice único filtrado `UX_Turnos_UnSoloEnAtencionPorServicio` sobre `(ServicioId)` cuando `Estado = 'En atención'`.
- Implementar las operaciones de llamada y turno actual en `Servicio.Infrastructure` con Dapper y SQL Server.
- Dentro de una transacción, adquirir un bloqueo exclusivo de aplicación transaccional con recurso estable por `ServicioId` (no por fecha). Mantenerlo hasta confirmar o revertir.
- Bajo el bloqueo, consultar primero cualquier turno del servicio en «En atención», sin filtrar por fecha. Si existe, devolver el resultado de conflicto «finalizar la atención actual», sin modificar datos.
- Si no hay activo, capturar `SYSDATETIMEOFFSET()` del servidor SQL después de obtener el bloqueo y elegir el turno del servicio con `Estado = 'Esperando'` y `FechaTurno` igual al día local capturado.
- Seleccionar por `FechaHoraGeneracion ASC, Correlativo ASC`; no aceptar selección del cliente. Si no hay candidato, revertir/salir sin escritura y devolver «No hay turnos en espera para este servicio».
- Materializar el estado del candidato en Domain y validar la transición `Esperando` → `En atención`. Actualizar condicionalmente la fila por `TurnoId` y estado anterior, asignando `Estado` y `FechaHoraLlamado` dentro de la transacción; confirmar solo si se afectó exactamente el candidato elegido.
- La combinación de bloqueo por servicio y transacción serializa las llamadas de la aplicación; la actualización condicional evita sobrescribir un estado cambiado. El índice filtrado rechaza cualquier segunda fila activa por servicio incluso ante un escritor concurrente que no use el flujo normal.
- Traducir únicamente los conflictos de negocio definidos. Informar errores de bloqueo, transacción y persistencia como errores técnicos explícitos; no convertirlos en ausencia de espera.
- La lectura de turno actual busca estado «En atención» por servicio en todos los días. La unicidad filtrada permite una respuesta única; no hace escrituras.

### Web y API

- Añadir página de llamado en el proyecto Web, servida en `/turnos/llamar`, y reutilizar `GET /api/servicios` para seleccionar el servicio.
- Exponer `POST /api/servicios/{servicioId}/turnos/llamar-siguiente`, sin cuerpo y sin parámetro para seleccionar el número.
- Devolver `200 OK` con el turno que quedó «En atención» y `fechaHoraLlamado` cuando la transición se confirma.
- Devolver `409 Conflict` con códigos/mensajes diferenciados para «No hay turnos en espera para este servicio» y para turno ya activo con instrucción de finalizar la atención actual.
- Exponer `GET /api/servicios/{servicioId}/turno-actual`. Para servicio existente sin activo responde `200 OK` con `turnoActual: null`; Web muestra «Ninguno». Para servicio inexistente ambas rutas responden `404`.
- Sin servicio seleccionado, Web solicita la selección y no envía un llamado. No mostrar la fila ni el turno anterior como si correspondiera a una selección no vigente.
- Tras llamada exitosa, mostrar el número/turno actual. Al volver a consultar SPEC-03, el turno ya no aparece en espera porque su estado persistido cambió.
- Mensajes claros en español; controles etiquetados y navegables por teclado.

## Estructura propuesta

Se amplían los proyectos existentes sin añadir una capa:

```text
src/
├── Servicio.Domain/
│   └── Turno.cs
├── Servicio.Application/
│   └── Turnos/
│       ├── LlamarSiguienteTurno.cs
│       └── ConsultarTurnoActual.cs
├── Servicio.Infrastructure/
│   ├── Database/
│   │   └── 004-llamar-turno.sql
│   └── Turnos/
│       └── SqlServerTurnoRepository.cs
└── Servicio.Web/
    ├── Endpoints/
    │   └── TurnosEndpoints.cs
    ├── Pages/
    │   └── Turnos/Llamar.cshtml
    └── wwwroot/js/llamar-turno.js

tests/
├── Servicio.Domain.Tests/
│   └── TurnoTests.cs
├── Servicio.Application.Tests/
│   └── LlamarSiguienteTurnoTests.cs
└── Servicio.Web.Tests/
    ├── Api/LlamarSiguienteTurnoTests.cs
    └── Infrastructure/SqlServerTurnoRepositoryTests.cs
```

Si la implementación de SPEC-02/03 ya consumió el prefijo `004` para otro script, conservar la secuencia real de migraciones al implementar, manteniendo en esta spec el alcance de cambio de esquema indicado.

## Modelo y restricciones de base de datos

Los campos completos de `dbo.Turnos` pertenecen a [SPEC-02](../002-generar-turno/data-model.md); la ampliación de esta spec es `FechaHoraLlamado`, nullable hasta la transición. La restricción `UX_Turnos_UnSoloEnAtencionPorServicio` es única y filtrada sobre `ServicioId` para `Estado = 'En atención'`.

Esta clave no incluye `FechaTurno`: si un servicio tiene un turno activo generado ayer, no puede llamarse un turno de hoy. El índice es obligatorio y complementa —no sustituye— el bloqueo transaccional por servicio.

## Condición de carrera y atomicidad

1. Abrir transacción SQL Server y adquirir exclusión mutua con `sp_getapplock` exclusivo, transaccional y con nombre estable por `ServicioId`.
2. Consultar si ya existe un turno `En atención` para el servicio en cualquier fecha. Si existe, no ejecutar actualización.
3. Capturar el reloj local SQL Server; buscar el candidato en `Esperando` de `FechaTurno` actual con orden `(FechaHoraGeneracion, Correlativo)`.
4. Si no hay candidato, no modificar filas y devolver el resultado de negocio de fila vacía.
5. Validar en Domain que el candidato aún está `Esperando`; actualizar la fila de forma condicional, guardando `En atención` y `FechaHoraLlamado`, en la misma transacción.
6. Confirmar transacción y liberar el bloqueo. Una solicitud simultánea del mismo servicio queda detrás del bloqueo; al entrar, observa el turno ya activo y se rechaza sin volver a llamar el candidato.
7. El índice único filtrado impide persistir una segunda fila activa por servicio aunque otro camino de escritura intente eludir el bloqueo. La violación del índice no se devuelve como llamada exitosa.

Bloqueos o errores SQL deben informarse explícitamente como errores técnicos y no disfrazarse de «sin turnos en espera». Los servicios distintos usan recursos de bloqueo distintos y pueden avanzar de forma independiente.

## Contratos de API

Los contratos normativos están en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Método y ruta | Parámetros/cuerpo | Respuesta satisfactoria | Rechazos definidos |
|---|---|---|---|
| `POST /api/servicios/{servicioId}/turnos/llamar-siguiente` | `servicioId` entero positivo en ruta; sin cuerpo ni elección de turno. | `200` con `servicioId`, `turnoId`, `numeroTurno`, `estado` y `fechaHoraLlamado`. | `404` servicio inexistente; `409` sin turnos elegibles, o `409` ya hay uno en atención, con códigos y mensajes diferentes. Sin selección es una validación de interfaz: no enviar petición. |
| `GET /api/servicios/{servicioId}/turno-actual` | `servicioId` entero positivo en ruta; sin filtros de fecha. | `200` con `turnoActual` y datos de llamado si existe; `turnoActual: null` representa «Ninguno». | `404` servicio inexistente. |

La consulta del turno actual incluye activos de días previos. La llamada solo elige candidatos del día local actual, pero cualquier activo anterior bloquea la operación.

## Matriz de criterios de aceptación y pruebas

Los diez escenarios se identifican `RF04-AT-01` a `RF04-AT-10` en el orden de aparición de [spec.md](./spec.md). Guardar resultados y capturas en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-XX/` o `evidence/CE-XXX/`.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF04-AT-01 | Llamar el turno más antiguo del día, cambiar a «En atención», registrar fecha/hora y mostrarlo como actual. | Prueba Domain/Application y API/SQL Server verifica el candidato, estado y marca persistidos; aceptación manual captura el turno actual. |
| RF04-AT-02 | Al llamar C-001 de C-001/C-002, C-002 queda primero en espera. | Integración llama al más antiguo y consulta API de SPEC-03 para verificar estado/fila y total; guardar `.trx` y captura. |
| RF04-AT-03 | El llamado afecta solo al servicio seleccionado. | Prueba de integración prepara dos servicios y comprueba que solo cambia la fila objetivo; evidencia antes/después. |
| RF04-AT-04 | El turno llamado desaparece de la fila de espera y el total baja en uno. | Prueba de integración llama, consulta SPEC-03 y compara elementos/total antes y después; evidencia `.trx`. |
| RF04-AT-05 | Consultar turno actual con un activo devuelve su número. | Prueba API del endpoint de turno actual verifica número, estado y fecha/hora de llamado; captura UI. |
| RF04-AT-06 | Sin turno activo, el turno actual se muestra como «Ninguno». | Prueba API verifica `turnoActual: null`; aceptación UI verifica el texto «Ninguno». |
| RF04-AT-07 | El turno activo y su estado se conservan al reiniciar aplicación. | Prueba de integración persiste llamada, crea nuevo host y consulta el turno actual; verifica estado y fecha/hora. |
| RF04-AT-08 | Sin servicio seleccionado, solicitar selección y no modificar datos. | Prueba UI verifica mensaje, ausencia de llamada API y datos sin cambios; captura. |
| RF04-AT-09 | Sin turno elegible ni activo, mostrar mensaje definido y no cambiar datos. | Prueba API/SQL comprueba `409 sin_turnos_en_espera`, mensaje y filas intactas; aceptación UI captura el rechazo. |
| RF04-AT-10 | Con un turno ya activo, informar que debe finalizarse y no alterar turnos. | Prueba API/SQL con turno activo, incluso de día previo, verifica `409 turno_en_atencion` y estado/marcas sin cambios; aceptación UI captura mensaje. |
| CE-001 | Toda llamada válida elige el turno elegible más antiguo y lo pasa a atención con fecha/hora. | Consolidar RF04-AT-01 y RF04-AT-02; guardar `evidence/CE-001/resultado.md`. |
| CE-002 | Nunca hay más de un activo por servicio y se rechaza una segunda llamada sin cambios. | Pruebas de índice, carrera y rechazo RF04-AT-10; consolidar resultado de concurrencia en `evidence/CE-002/resultado.md`. |
| CE-003 | El turno actual coincide con el único activo o se muestra «Ninguno». | Pruebas RF04-AT-05, RF04-AT-06 y RF04-AT-07; consolidar en `evidence/CE-003/resultado.md`. |
| CE-004 | Rechazos por falta de selección, fila vacía o activo muestran su mensaje y no cambian datos. | Consolidar RF04-AT-08 a RF04-AT-10 con capturas y comparación de datos en `evidence/CE-004/resultado.md`. |
| CE-005 | La llamada conserva estado y fecha/hora tras reiniciar. | Integración y aceptación manual RF04-AT-07; guardar `.trx` y verificación en `evidence/CE-005/resultado.md`. |
| CE-006 | Seleccionar servicio, llamar y leer el turno actual en menos de 30 segundos. | Prueba manual cronometrada; guardar tiempo, contexto y captura en `evidence/CE-006/resultado.md`. |

**Prueba concurrente obligatoria**: ejecutar dos solicitudes simultáneas de llamado para el mismo servicio con varios turnos en espera. Verificar que exactamente una transiciona a «En atención», la otra obtiene el conflicto de turno activo, ningún turno se llama dos veces y la base nunca presenta dos filas activas para el servicio. Conservar resultados SQL/API en `evidence/RF04-AT-01/concurrencia.trx` y `evidence/RF04-AT-10/concurrencia.trx`.

## Referencias del diseño específico

- [Investigación](./research.md)
- [Modelo de datos](./data-model.md)
- [Contrato API](./contracts/openapi.yaml)
- [Guía de validación](./quickstart.md)

No se genera código ni `tasks.md` en esta etapa.
