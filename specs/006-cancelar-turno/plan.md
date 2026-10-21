# Plan de implementación: Cancelar turno

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md) (SPEC-06)

**Entrada**: [spec.md](./spec.md)

## Resumen

Permitir cancelar individualmente un turno que continúa en `Esperando`, después de que la interfaz presente su número y la persona recepcionista confirme. Domain limita la transición a `Esperando` → `Cancelado`; Infrastructure conserva el turno, añade `FechaHoraCancelacion` y valida el estado de forma atómica en SQL Server. La consulta existente de SPEC-03 excluye automáticamente el turno cancelado del total y las posiciones se recalculan sin cambiar el orden relativo de los turnos restantes. La secuencia de SPEC-02 no se modifica ni reutiliza números cancelados.

## Contexto técnico

Las decisiones comunes de lenguaje, capas, proyectos, API, SQL Server con Dapper y pruebas se heredan de [SPEC-01](../001-registrar-servicios/plan.md) a [SPEC-05](../005-finalizar-atencion/plan.md). Este plan describe los cambios de cancelación y sus integraciones específicas.

**Lenguaje y versión**: Sin cambios respecto a SPEC-01: C# con .NET 10 (`net10.0`).

**Dependencias principales**: Sin paquetes nuevos; reutilizar ASP.NET Core, Dapper, SQL Server y xUnit ya establecidos.

**Almacenamiento**: Agregar `FechaHoraCancelacion DATETIMEOFFSET(7) NULL` a `dbo.Turnos`; conservar todas las columnas y la fila. No se cambia `dbo.ContadoresTurno`.

**Pruebas**: xUnit para Domain/Application; pruebas HTTP; integración con SQL Server real para persistencia, número, cambios simultáneos cancelar/llamar y fila; aceptación manual con capturas.

**Plataforma y proyectos**: Aplicación existente en `Servicio.Domain`, `Servicio.Application`, `Servicio.Infrastructure` y `Servicio.Web`; no crear proyectos.

**Metas de rendimiento**: Verificar CE-006: identificar el número, revisar la confirmación y completar o rechazar en menos de 30 segundos.

**Restricciones**: Solo se cancelan turnos individuales en `Esperando`; la confirmación se hace antes de invocar la API y cancelar/cerrar el diálogo no realiza petición. No se cancelan turnos activos/finalizados/cancelados, no se reabren turnos, no se hacen cancelaciones masivas ni se notifica al cliente. El número emitido y su contador no se revierten.

**Dependencias funcionales**: SPEC-02 provee turnos y correlativos; SPEC-03 provee fila, orden y posiciones; SPEC-04 provee el llamado que compite por el estado; SPEC-05 provee la transición a `Finalizado`. Se consumen sus componentes, sin reimplementarlos.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-06 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | El diseño deriva de SPEC-06 y de las dependencias funcionales declaradas. |
| Trazabilidad | Cumple | Los nueve escenarios RF06-AT y seis criterios CE se asocian con pruebas y evidencia. |
| Criterios verificables | Cumple | Cada aceptación se verifica con pruebas automatizadas o manuales observables. |
| Arquitectura en capas | Cumple | Domain limita la transición, Application declara el caso de uso, Infrastructure persiste y Web presenta la confirmación/API. |
| Alcance mínimo viable | Cumple | Solo se cancela un turno individual después de confirmación. |
| Pruebas con evidencia | Cumple | xUnit, API, SQL Server real y capturas cubren los criterios. |
| UX clara y accesible | Cumple | La confirmación muestra el número, permite cancelar el diálogo y ofrece mensajes claros con teclado. |
| Uso responsable de IA | Cumple | El equipo revisa y valida el trabajo asistido antes de integrarlo. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta únicamente en español por instrucción expresa. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`, sin crear ni cambiar ramas. |

**Resultado de las puertas**: las reglas de cancelación, confirmación, persistencia, elegibilidad y exclusión de la fila están definidas. La regla de carrera solicitada —si cancelar y llamar compiten por el mismo turno, el perdedor debe rechazarse en lugar de actuar sobre ese turno— requiere que el llamado de SPEC-04 compare el turno esperado. El endpoint actual de «llamar siguiente» solo recibe el servicio y podría seleccionar otro turno si la cancelación gana. Para cumplir la regla sin ambigüedad, el contrato/flujo de llamada de SPEC-04 debe admitir una precondición de `TurnoId` esperado y responder conflicto cuando cambió. Esta dependencia se documenta aquí; no se modifica ninguna carpeta distinta a SPEC-06 en esta entrega.

## Diseño específico por capa

### Domain

- Extender `Turno` con `FechaHoraCancelacion` nullable.
- Añadir operación de transición que acepta exclusivamente el estado `Esperando`, asigna `Cancelado` y conserva la marca de cancelación recibida.
- Rechazar `En atención`, `Finalizado` y `Cancelado` sin modificar el turno; no definir transición de salida de `Cancelado`.
- No colocar lógica de confirmación en Domain; esta es una interacción de interfaz.

### Application

- Añadir el caso de uso `CancelarTurno` que recibe `TurnoId`; la solicitud representa una acción que ya fue confirmada por la interfaz.
- Declarar en Application el contrato de repositorio que retorna el turno cancelado o resultados diferenciados de turno inexistente, ya cancelado y no cancelable por estado.
- No aceptar como entrada estado destino, fecha/hora ni nombre/número editables. Propagar errores técnicos explícitamente.
- Asegurar que una petición repetida o un estado ya cambiado se exponga como rechazo, no como éxito idempotente.

### Infrastructure y base de datos

- Agregar script de esquema `src/Servicio.Infrastructure/Database/006-cancelar-turno.sql` con `FechaHoraCancelacion DATETIMEOFFSET(7) NULL`; no borrar ni mutar `NumeroTurno`, `FechaHoraGeneracion`, `FechaHoraLlamado`, `NombreCliente`, `ServicioId` o contador.
- Implementar mediante Dapper una transacción por cancelación. Obtener el `ServicioId` del turno, adquirir el mismo bloqueo exclusivo transaccional por servicio que usan los endpoints de llamada/finalización, volver a leer la fila tras obtener el bloqueo y validar estado `Esperando`.
- Obtener `SYSDATETIMEOFFSET()` del servidor y actualizar condicionalmente `Estado = 'Esperando'` a `Estado = 'Cancelado'`, asignando `FechaHoraCancelacion`; confirmar solo si se modificó exactamente un turno.
- El camino de llamada SPEC-04 y el de cancelación deben usar el mismo recurso de bloqueo por `ServicioId`, así como la misma identidad de turno esperada. La operación de llamado debe aceptar `TurnoIdEsperado` como precondición: si la fila ya no es `Esperando` o dejó de ser el siguiente candidato, rechazarla sin llamar un turno distinto en respuesta a esa solicitud obsoleta. Una nueva acción explícita podrá consultar y llamar el siguiente según SPEC-04.
- Si la llamada gana el bloqueo, la cancelación revalida y rechaza la fila ahora `En atención`. Si la cancelación gana, el llamado ligado a ese `TurnoId` encuentra `Cancelado` y rechaza. La actualización condicional por estado funciona como defensa adicional; las dos operaciones no pueden confirmar cambios incompatibles sobre ese turno.
- No cambiar el contador de SPEC-02. La secuencia ya incrementada es el registro de números emitidos y, al no borrarse el turno, la restricción única existente continúa protegiendo el número histórico.
- No agregar una regla que reordene o edite turnos restantes: la consulta de SPEC-03 recalcula posiciones al leer.

### Web y API

- Añadir a la interfaz existente de fila de espera una acción «Cancelar» por cada turno elegible. Antes de enviar la API, mostrar diálogo accesible que identifica el número (por ejemplo, `C-003`) y ofrece confirmar o cancelar/cerrar.
- Si no se confirma, cerrar el diálogo y no llamar a la API; el turno y la fila conservan todos sus datos.
- Si se confirma, invocar `POST /api/turnos/{turnoId}/cancelar`, sin cuerpo ni bandera `confirmado`: la petición solo se emite desde la acción de confirmación. No aceptar un `TurnoId` distinto al que se presentó en el diálogo.
- Devolver `200 OK` con el turno en `Cancelado` y `fechaHoraCancelacion`; `404 Not Found` para identificador inexistente; `409 Conflict` para turno ya cancelado o que no está en espera, usando códigos/mensajes diferenciados.
- Después del éxito, volver a consultar la fila de SPEC-03. La respuesta excluye el cancelado, decrementa el total y recalcula posiciones; mostrar confirmación. No simular el resultado antes del commit.
- En la interacción de llamada SPEC-04, enviar la identidad esperada del candidato mostrado/confirmado como precondición y mostrar el conflicto claro si dejó `Esperando`. El ajuste del contrato existente se debe registrar/coordinar con SPEC-04 antes de implementar la garantía simultánea; no se altera aquí su documentación.

## Estructura de implementación

Se amplían proyectos existentes sin agregar capas:

```text
src/
├── Servicio.Domain/
│   └── Turno.cs
├── Servicio.Application/
│   └── Turnos/
│       └── CancelarTurno.cs
├── Servicio.Infrastructure/
│   ├── Database/
│   │   └── 006-cancelar-turno.sql
│   └── Turnos/
│       └── SqlServerTurnoRepository.cs
└── Servicio.Web/
    ├── Endpoints/
    │   └── TurnosEndpoints.cs
    ├── Pages/FilaEspera/
    │   └── Index.cshtml
    └── wwwroot/js/
        └── fila-espera.js

tests/
├── Servicio.Domain.Tests/
│   └── TurnoCancelacionTests.cs
├── Servicio.Application.Tests/
│   └── CancelarTurnoTests.cs
└── Servicio.Web.Tests/
    ├── Api/CancelarTurnoApiTests.cs
    ├── Infrastructure/CancelacionLlamadoConcurrentesTests.cs
    └── Ui/ConfirmacionCancelarTurnoTests.cs
```

## Modelo y consistencia

El modelo base y el contador permanecen según [SPEC-02](../002-generar-turno/data-model.md); la fila sigue siendo la proyección de lectura de [SPEC-03](../003-consultar-fila-espera/data-model.md). El único campo nuevo es `FechaHoraCancelacion DATETIMEOFFSET(7) NULL`, detallado en [data-model.md](./data-model.md).

| Estado origen | Estado destino | Condición |
|---|---|---|
| `Esperando` | `Cancelado` | La interfaz presentó el número y la persona recepcionista confirmó; el turno aún debe estar esperando al procesar la operación. |
| `En atención`, `Finalizado` o `Cancelado` | Ninguno | Rechazar sin mutar ningún dato. |

La cancelación deja intacto el correlativo/contador. Al permanecer en `dbo.Turnos`, el número no vuelve a estar disponible. La fila filtra por `Estado = 'Esperando'`; por eso deja de incluir el cancelado, el total baja en uno y `ROW_NUMBER()` renumera consecutivamente solo los restantes conservando su orden relativo.

## Contrato de API y errores

El contrato normativo se encuentra en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Método y ruta | Parámetros/cuerpo | Resultado |
|---|---|---|
| `POST /api/turnos/{turnoId}/cancelar` | `turnoId` entero positivo en ruta; sin cuerpo y sin confirmación enviada desde el cliente. | `200` con registro `Cancelado`; `404` turno inexistente; `409` si ya está cancelado o si su estado no es `Esperando`. |

El endpoint procesa únicamente la orden ya confirmada por la interfaz; no abre diálogo ni acepta `confirmado: false`. La confirmación cancelada o cerrada no genera solicitud. Un estado que cambió mientras el diálogo estaba abierto se valida de nuevo en SQL bajo el bloqueo compartido.

## Matriz de criterios de aceptación y pruebas

Los nueve escenarios de [spec.md](./spec.md) se identifican `RF06-AT-01` a `RF06-AT-09`, en su orden de aparición. Guardar evidencia bajo `specs/006-cancelar-turno/evidence/RF06-AT-XX/` o `evidence/CE-XXX/`.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF06-AT-01 | Confirmar cancela el turno en espera, guarda hora y muestra confirmación. | Prueba Domain/Application/API/SQL Server confirma transición y marca; aceptación manual conserva captura del número, diálogo, resultado y confirmación. |
| RF06-AT-02 | Rechazar o cerrar confirmación deja estado y todos los datos sin cambios. | Prueba UI verifica que no se envía POST y compara snapshot; aceptación manual guarda captura de diálogo cerrado y fila intacta. |
| RF06-AT-03 | Turno cancelado desaparece de la fila y el total disminuye en uno. | Prueba integración cancela y consulta GET de SPEC-03; verifica exclusión y total, más captura de fila refrescada. |
| RF06-AT-04 | Cancelar C-002 deja C-001 en posición 1 y C-003 en posición 2. | Prueba SQL/API consulta fila tras cancelar C-002 y comprueba números, posiciones consecutivas y orden relativo; captura manual. |
| RF06-AT-05 | La generación posterior usa el siguiente número, nunca el correlativo cancelado. | Prueba integración SQL Server genera C-001/C-002, cancela C-002 y genera otro; verifica que recibe el siguiente correlativo y no reutiliza C-002. |
| RF06-AT-06 | Tras reinicio, registro conserva Cancelado y número. | Prueba de integración cancela, recrea host y lee fila persistida; aceptación manual adjunta captura del resultado disponible por flujo de prueba. |
| RF06-AT-07 | En atención o Finalizado no se puede cancelar y no cambian datos. | Prueba Domain/API/SQL prepara ambos estados y verifica `409` diferenciado y snapshots intactos. |
| RF06-AT-08 | Una segunda cancelación de un turno cancelado se rechaza sin cambios. | Prueba de API repite la operación y verifica `409 turno_ya_cancelado`, `FechaHoraCancelacion` y demás columnas intactas. |
| RF06-AT-09 | Si el turno deja de estar Esperando mientras está abierto el diálogo, confirmar no lo cancela. | Prueba UI/SQL cambia turno a En atención antes del POST; el POST devuelve conflicto, el turno y marcas actuales se conservan. |
| CE-001 | Todas las cancelaciones confirmadas cambian estado y guardan la hora. | Consolidar evidencia de RF06-AT-01 y RF06-AT-05 en `evidence/CE-001/resultado.md`. |
| CE-002 | Las cancelaciones no confirmadas o inválidas no alteran los datos. | Consolidar snapshots de RF06-AT-02 y RF06-AT-07 a RF06-AT-09 en `evidence/CE-002/resultado.md`. |
| CE-003 | Los cancelados no aparecen ni cuentan y los restantes mantienen orden relativo. | Consolidar consultas de fila RF06-AT-03/04, posiciones antes/después y capturas en `evidence/CE-003/resultado.md`. |
| CE-004 | Ningún número cancelado vuelve a asignarse. | Consolidar contador/turnos SQL y generación posterior de RF06-AT-05 en `evidence/CE-004/resultado.md`. |
| CE-005 | Estado, número y hora de cancelación sobreviven reinicio. | Consolidar persistencia de RF06-AT-06 con snapshot SQL/API en `evidence/CE-005/resultado.md`. |
| CE-006 | La persona puede revisar la confirmación y completar o rechazar en menos de 30 segundos. | Aceptación manual cronometrada, guardar tiempo, escenario (confirmar/rechazar), contexto y captura en `evidence/CE-006/resultado.md`. |

**Prueba concurrente obligatoria**: desde dos operaciones simultáneas para el mismo turno `Esperando`, una cancelación confirmada y un llamado condicionado al `TurnoId` esperado, comprobar que solo una transición se confirma; la perdedora devuelve conflicto claro, la fila conserva estado y marcas coherentes, y nunca existe un mismo turno simultáneamente `Cancelado` y `En atención`. Ejecutar con SQL Server real y guardar `.trx` en `evidence/RF06-AT-09/concurrencia.trx`. Si SPEC-04 aún no implementa la precondición del turno esperado, registrar la prueba como bloqueada por esa dependencia, no como aprobada.

## Artefactos de diseño

- [Investigación](./research.md)
- [Modelo de datos](./data-model.md)
- [Contrato OpenAPI](./contracts/openapi.yaml)
- [Guía de validación](./quickstart.md)

No se genera código ni `tasks.md` en esta etapa.
