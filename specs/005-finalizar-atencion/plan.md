# Plan de implementación: Finalizar atención

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md) (SPEC-05)

**Entrada**: [spec.md](./spec.md)

## Resumen

Agregar la finalización del único turno «En atención» del servicio elegido. Domain permitirá exclusivamente la transición `En atención` → `Finalizado`; Infrastructure guardará `FechaHoraFinalizacion` junto al cambio de estado en una operación transaccional serializada por servicio, y Web informará el resultado. El turno y todos sus datos de identificación y atención previa permanecen en `dbo.Turnos`; al dejar de estar activo, la consulta de turno actual de SPEC-04 debe devolver `turnoActual: null` y la interfaz mostrar «Ninguno». La finalización no llama automáticamente al siguiente.

## Contexto técnico

Las decisiones comunes de plataforma, capas, proyectos, SQL Server con Dapper, API REST y pruebas se heredan de [SPEC-01](../001-registrar-servicios/plan.md) a [SPEC-04](../004-llamar-siguiente-turno/plan.md). Este diseño detalla solo la transición y persistencia nuevas de SPEC-05.

**Lenguaje y versión**: Sin cambios respecto a SPEC-01: C# con .NET 10 (`net10.0`).

**Dependencias principales**: Sin paquetes nuevos; reutilizar ASP.NET Core, Dapper, SQL Server y xUnit definidos en SPEC-01.

**Almacenamiento**: Extender `dbo.Turnos` con `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL`; no se agrega tabla ni se elimina o reemplaza el registro finalizado.

**Pruebas**: Mismo marco que SPEC-01; agregar pruebas de transición Domain, caso de uso, API, integración SQL Server/persistencia, concurrencia y aceptación manual.

**Plataforma y proyectos**: Aplicación ASP.NET Core existente en `Servicio.Domain`, `Servicio.Application`, `Servicio.Infrastructure` y `Servicio.Web`; no crear proyectos nuevos.

**Metas de rendimiento**: Verificar el criterio CE-006 de finalización y reconocimiento de que el servicio quedó libre en menos de 30 segundos. No se define otro objetivo de carga.

**Restricciones**: Solo finalizar el turno actualmente «En atención» del servicio seleccionado. No permitir finalizar turnos en otros estados ni reabrir o modificar un turno «Finalizado». No agregar consulta histórica, cancelación, edición, reportes o estadísticas. No seleccionar ni llamar otro turno automáticamente.

**Dependencias funcionales**: Se requieren servicios de SPEC-01, generación y persistencia de turnos de SPEC-02, y transición a «En atención»/consulta de turno actual de SPEC-04. SPEC-03 no se modifica; la fila deja de incluir el turno al usar el estado que ya filtra.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-05 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | El diseño deriva de SPEC-05 y depende de los flujos aprobados de SPEC-01 a SPEC-04. |
| Trazabilidad | Cumple | La matriz vincula los nueve escenarios RF05-AT y los seis criterios CE con pruebas y evidencia. |
| Criterios verificables | Cumple | Cada resultado observable se prueba con xUnit, API/SQL Server o aceptación manual. |
| Arquitectura en capas | Cumple | Domain valida la transición, Application coordina, Infrastructure persiste y Web expone la operación. |
| Alcance mínimo viable | Cumple | La operación solo finaliza; no reabre ni llama al siguiente. |
| Pruebas con evidencia | Cumple | Cada escenario y criterio de éxito tiene evidencia automatizada o manual definida. |
| UX clara y accesible | Cumple | La interfaz distingue selección requerida, ausencia de turno activo y finalización correcta; conserva etiquetas y navegación por teclado existentes. |
| Uso responsable de IA | Cumple | Los cambios asistidos se revisarán y validarán por una persona del equipo antes de integrarse. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta solo en español por instrucción expresa del usuario. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`; no se crea ni cambia ninguna rama. |

**Resultado de las puertas**: no quedan decisiones técnicas pendientes. El usuario determina que el estado final es «Finalizado». La introducción de la especificación contiene una mención a «Atendido», pero los requisitos RF-004/RF-007/RF-009, los escenarios, los criterios de éxito y las decisiones de este encargo establecen «Finalizado»; se usa ese valor de manera consistente sin modificar la especificación.

## Diseño específico por capa

### Domain

- Extender la entidad `Turno` con `FechaHoraFinalizacion` nullable.
- Agregar una única operación de dominio que reciba la fecha/hora del servidor y permita solo `En atención` → `Finalizado`.
- Si el origen no es `En atención` —incluido `Finalizado`— rechazar sin modificar estado, fechas, número, cliente ni servicio. No agregar transiciones de salida de `Finalizado`.
- Mantener Domain independiente de Web, SQL Server y Dapper.

### Application

- Agregar el caso de uso `FinalizarAtencion` por `ServicioId`; el cliente no envía `TurnoId` ni fecha/hora de finalización.
- Definir un contrato en Application para finalizar el turno actual y devolver el registro finalizado, servicio inexistente o ausencia de turno activo.
- No decidir en Web qué turno finalizar ni duplicar la selección del turno actual.
- Propagar los fallos técnicos de persistencia explícitamente; no traducirlos a «no hay turno en atención».

### Infrastructure y base de datos

- Agregar el cambio versionado `src/Servicio.Infrastructure/Database/005-finalizar-atencion.sql` que introduce `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL` en `dbo.Turnos`. La columna queda nula antes de finalizar; no alterar columnas ni datos de generación/llamado.
- Reutilizar Dapper y el repositorio de turnos existente. No añadir una tabla o un índice de historial.
- Ejecutar en una transacción y adquirir, antes de leer, el mismo bloqueo exclusivo de aplicación por `ServicioId` que usa SPEC-04 para llamadas. La clave/recurso debe ser compartido por ambas operaciones, no un bloqueo diferente para finalizar.
- Bajo el bloqueo, obtener del servidor SQL la fecha/hora con desfase mediante `SYSDATETIMEOFFSET()`, localizar el único turno activo del servicio y materializarlo para validar en Domain.
- Actualizar de forma condicional el registro identificado solo si sigue `Estado = 'En atención'` y `FechaHoraFinalizacion IS NULL`; asignar `Estado = 'Finalizado'` y la marca de fin en la misma instrucción/transacción. Confirmar únicamente si se modificó exactamente un registro.
- Si al obtener el bloqueo no hay turno activo, no escribir y devolver el resultado de negocio que Web traduce a conflicto. Si la actualización condicional no cambia exactamente una fila, tratarlo como rechazo sin éxito y preservar la integridad; no devolver una finalización confirmada.
- El bloqueo serializa dos finalizaciones simultáneas del mismo servicio y coordina también con el endpoint de llamada de SPEC-04. Tras la primera confirmación, la segunda observa que ya no hay turno activo y recibe el mensaje de ausencia. La actualización condicional es una defensa adicional. El índice filtrado de SPEC-04 deja de incluir la fila al cambiar su estado, liberando el servicio sin borrar el turno.

### Web y API

- Reutilizar la página de operación de turnos del proyecto Web y el selector de servicios existente; agregar la acción «Finalizar atención» para el servicio seleccionado.
- Exponer `POST /api/servicios/{servicioId}/turnos/finalizar-atencion`, sin cuerpo. La interfaz no envía una solicitud mientras no haya servicio seleccionado; solicita elegir uno y no modifica datos.
- Responder `200 OK` tras confirmar la transacción, con la representación del turno finalizado y todos los datos que debe conservar: servicio, número, cliente nullable, estado, fecha/hora de generación, llamado y finalización.
- Responder `404 Not Found` si el servicio no existe y `409 Conflict` con código/mensaje «No hay un turno en atención para este servicio» si no existe turno activo. No se presenta un conflicto técnico como rechazo de negocio.
- Tras el éxito, mostrar confirmación y actualizar el turno actual mediante el endpoint GET de SPEC-04; su respuesta debe ser `turnoActual: null` y la interfaz debe mostrar «Ninguno». No llamar automáticamente al siguiente.

## Estructura de implementación

Se amplían únicamente los proyectos existentes; las ubicaciones nuevas o ampliadas para SPEC-05 son:

```text
src/
├── Servicio.Domain/
│   └── Turno.cs
├── Servicio.Application/
│   └── Turnos/
│       └── FinalizarAtencion.cs
├── Servicio.Infrastructure/
│   ├── Database/
│   │   └── 005-finalizar-atencion.sql
│   └── Turnos/
│       └── SqlServerTurnoRepository.cs
└── Servicio.Web/
    ├── Endpoints/
    │   └── TurnosEndpoints.cs
    ├── Pages/Turnos/
    │   └── Llamar.cshtml
    └── wwwroot/js/
        └── llamar-turno.js

tests/
├── Servicio.Domain.Tests/
│   └── TurnoFinalizacionTests.cs
├── Servicio.Application.Tests/
│   └── FinalizarAtencionTests.cs
└── Servicio.Web.Tests/
    ├── Api/FinalizarAtencionApiTests.cs
    ├── Infrastructure/FinalizacionesSimultaneasTests.cs
    └── Ui/FinalizarAtencionTests.cs
```

La llamada existente de SPEC-04 y la consulta de turno actual conservan sus contratos; no se reimplementan en esta estructura.

## Modelo persistente y transición

El modelo base de servicios y turnos se define en [SPEC-01](../001-registrar-servicios/plan.md) y [SPEC-02](../002-generar-turno/data-model.md); SPEC-04 agrega `FechaHoraLlamado`. La única columna nueva para SPEC-05 es `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL`, descrita en [data-model.md](./data-model.md).

| Estado origen | Estado destino | Validación |
|---|---|---|
| `En atención` | `Finalizado` | Únicamente para el turno activo del servicio indicado; asignar la hora del servidor. |
| Cualquier otro estado, incluido `Finalizado` | Ninguno | Rechazar y conservar todos los datos sin cambios. |

No se crea una entidad de historial separada: el propio turno finalizado es el registro de atención y conserva sus datos originales.

## Contrato y errores

El contrato normativo está en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Método y ruta | Parámetros/cuerpo | Resultado |
|---|---|---|
| `POST /api/servicios/{servicioId}/turnos/finalizar-atencion` | `servicioId` obligatorio en ruta; sin cuerpo ni selección de turno individual. | `200` con el turno persistido en `Finalizado` y todas sus fechas/datos; `404` si el servicio no existe; `409` si no hay turno en atención. |

Sin servicio seleccionado es un estado de interfaz: mostrar «Selecciona un servicio para finalizar la atención» y no emitir la petición. Con un servicio existente sin activo, el endpoint devuelve `409` y un problema estructurado con código `sin_turno_en_atencion`; el estado y todas las columnas del turno quedan intactos. El endpoint GET de turno actual de SPEC-04 no cambia: tras finalizar, devuelve `turnoActual: null`.

## Concurrencia y atomicidad

1. Abrir transacción y adquirir el bloqueo exclusivo transaccional de SPEC-04 para el mismo `ServicioId`.
2. Capturar la hora del servidor y buscar el turno activo del servicio, sin elegir ni modificar otros servicios.
3. Si no hay turno `En atención`, terminar sin escritura con resultado de negocio «sin turno en atención».
4. Validar en Domain `En atención` → `Finalizado`; rechazar cualquier estado distinto.
5. Actualizar condicionalmente por identificador, estado anterior y fecha de finalización nula; persistir estado y `FechaHoraFinalizacion` juntas.
6. Confirmar si se actualizó exactamente un turno. Ante una segunda petición simultánea, el bloqueo se libera tras esta confirmación; la petición siguiente ve que no hay activo y devuelve el `409` previsto. No puede finalizar de nuevo el turno ya finalizado.
7. Al compartir la exclusión por servicio con SPEC-04, una llamada concurrente queda serializada: si la llamada ocurre primero, la finalización puede cerrar ese turno; si la finalización ocurre primero, el llamado posterior puede avanzar según las reglas de SPEC-04. La integración no cambia las reglas propias de ninguna operación.

Los rechazos y errores técnicos no deben producir una respuesta de éxito ni alterar el turno. El registro finalizado se conserva, y la marca de fin no sustituye la hora de generación ni la de llamado.

## Matriz de criterios de aceptación y pruebas

Los nueve escenarios se identifican `RF05-AT-01` a `RF05-AT-09`, en el orden en que aparecen en [spec.md](./spec.md). Conservar resultados y capturas bajo `specs/005-finalizar-atencion/evidence/RF05-AT-XX/` o `evidence/CE-XXX/`.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF05-AT-01 | Finalizar el activo cambia estado, guarda fecha/hora, muestra confirmación y deja turno actual en «Ninguno». | Prueba Domain/Application y API/SQL Server verifica transición y persistencia; prueba HTTP consulta GET actual; aceptación UI captura confirmación y «Ninguno». |
| RF05-AT-02 | Tras finalizar, SPEC-04 puede llamar al siguiente turno en espera. | Integración SQL Server/API finaliza y luego llama siguiente; comprueba el nuevo turno activo y conserva el registro anterior en `Finalizado`; captura manual del flujo separado. |
| RF05-AT-03 | Finalizar en un servicio no modifica el turno activo de otro servicio. | Integración con dos servicios compara estados/fechas antes y después; solo el turno del servicio elegido cambia. |
| RF05-AT-04 | El turno finalizado conserva número, nombre indicado y fechas/horas de generación, llamado y finalización. | Prueba SQL/API compara todos los campos anteriores con los del turno finalizado; aceptación UI captura la confirmación y prueba de integración lee el registro persistido. |
| RF05-AT-05 | La falta de nombre de cliente no impide finalizar ni altera el resto de los datos. | Prueba Domain/API/SQL finaliza un activo con nombre `NULL` y compara todas las demás columnas. |
| RF05-AT-06 | Tras cerrar y reabrir, el turno conserva estado final y datos de atención. | Prueba de integración recrea el host y vuelve a leer la fila en SQL Server; registra número, nombre nullable y las tres marcas temporales. |
| RF05-AT-07 | Sin servicio seleccionado, se solicita seleccionarlo y ningún dato cambia. | Prueba UI confirma mensaje, ausencia de petición POST y comparación sin cambios de turnos; aceptación manual guarda captura. |
| RF05-AT-08 | Un servicio sin turno activo recibe mensaje claro y no modifica datos. | Prueba API/SQL comprueba `409 sin_turno_en_atencion`, mensaje y comparación completa antes/después; aceptación UI captura el mensaje. |
| RF05-AT-09 | Un turno finalizado no se finaliza otra vez ni cambia de estado. | Pruebas Domain y API intentan una segunda finalización y cualquier transición desde `Finalizado`; comprueban rechazo y registro idéntico antes/después. |
| CE-001 | Todo turno válido cambia a «Finalizado», registra hora y muestra confirmación. | Consolidar RF05-AT-01, RF05-AT-02 y RF05-AT-04 en `evidence/CE-001/resultado.md`. |
| CE-002 | Después de finalizar, el servicio afectado muestra «Ninguno» hasta otro llamado. | Consolidar GET actual y capturas de RF05-AT-01 y RF05-AT-02 en `evidence/CE-002/resultado.md`. |
| CE-003 | Falta de selección o de turno activo se rechaza claramente y sin mutaciones. | Consolidar comparaciones y mensajes de RF05-AT-07 y RF05-AT-08 en `evidence/CE-003/resultado.md`. |
| CE-004 | Ningún turno finalizado vuelve a otro estado ni cambia al reintentar. | Consolidar pruebas Domain/API/SQL de RF05-AT-09, incluidas las dos finalizaciones simultáneas, en `evidence/CE-004/resultado.md`. |
| CE-005 | Tras reiniciar, se conservan número, cliente si existe, estado y horas de generación, llamado y finalización. | Consolidar prueba de persistencia RF05-AT-04 y RF05-AT-06 con resultado de cada campo en `evidence/CE-005/resultado.md`. |
| CE-006 | El recepcionista finaliza una atención y reconoce que el servicio quedó libre en menos de 30 segundos. | Aceptación manual cronometrada desde la selección hasta confirmar «Ninguno»; registrar tiempo, entorno y captura en `evidence/CE-006/resultado.md`. |

**Prueba concurrente obligatoria**: lanzar dos peticiones simultáneas de finalización para el mismo servicio con un único turno `En atención`. Comprobar que una responde `200`, la otra responde `409` con ausencia de turno activo, el turno tiene exactamente una `FechaHoraFinalizacion`, los datos previos se conservan y no queda ningún turno activo. Repetir verificando el endpoint de turno actual y conservar `.trx` en `evidence/RF05-AT-09/concurrencia.trx`.

## Artefactos de diseño

- [Investigación y decisiones](./research.md)
- [Modelo de datos](./data-model.md)
- [Contrato API](./contracts/openapi.yaml)
- [Guía de validación](./quickstart.md)

No se genera código ni `tasks.md` en esta etapa.
