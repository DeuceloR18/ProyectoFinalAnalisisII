# Investigación y decisiones de diseño: SPEC-04

## Alcance

SPEC-04 agrega el cambio controlado de un turno de «Esperando» a «En atención», y la lectura del turno actualmente atendido por servicio. La arquitectura, proyectos, SQL Server con Dapper, API REST, pruebas y modelo existente de servicios/turnos se heredan de [SPEC-01](../001-registrar-servicios/plan.md), [SPEC-02](../002-generar-turno/plan.md) y [SPEC-03](../003-consultar-fila-espera/plan.md).

## Decisiones

### Transición de estado

**Decisión**: Agregar a `Turno` la operación de dominio que solo permite la transición `Esperando` → `En atención`. Al llamarse correctamente recibe y conserva `FechaHoraLlamado`; no se agrega ninguna transición de salida de «En atención».

**Racional**: La especificación limita explícitamente la transición y excluye finalizar o cancelar turnos. Mantener la regla en Domain evita que un endpoint o una instrucción SQL decidan por sí solos si una transición es válida.

**Alternativas consideradas**:

- Cambiar el estado directamente en Web o solo en Infrastructure ubicaría una regla de negocio fuera de Domain.
- Agregar transiciones de finalización para permitir más llamadas ampliaría el alcance de SPEC-04.

### Serialización por servicio

**Decisión**: Implementar el llamado en una transacción de SQL Server y adquirir `sp_getapplock` exclusivo y transaccional sobre un recurso estable por `ServicioId`, independientemente de la fecha del turno. Dentro de la sección serializada: comprobar si hay un turno «En atención» para cualquier día; si lo hay, rechazar sin escritura. Si no lo hay, capturar `SYSDATETIMEOFFSET()`, determinar `FechaTurno` local del servidor, seleccionar el turno del servicio/día actual en `Esperando` más antiguo por `(FechaHoraGeneracion, Correlativo)`, y actualizar estado y hora de llamado con una condición de estado actual. Confirmar en una sola transacción.

**Racional**: La exclusión mutua por servicio serializa también el caso de dos solicitudes que intentan llamar el mismo turno. La segunda solicitud comprueba el estado actualizado bajo el mismo bloqueo y no puede volver a llamar ese registro. El filtro de candidato usa la fecha local del servidor coherente con SPEC-02/03. La actualización condicional y la transacción protegen frente a cambios concurrentes adicionales.

**Alternativas consideradas**:

- Leer el candidato y actualizarlo en comandos separados sin bloqueo permite que dos solicitudes seleccionen el mismo turno.
- `MAX` o `TOP` seguido de una actualización posterior no ofrece exclusión suficiente por sí mismo.
- Bloquear solo las filas `Esperando` del día no impide la llamada cuando existe un turno activo de un día anterior.

### Garantía de un solo turno activo en SQL Server

**Decisión**: Crear un índice único filtrado en `dbo.Turnos` sobre `ServicioId` con filtro `Estado = 'En atención'`. Agregar `FechaHoraLlamado DATETIMEOFFSET(7) NULL` para registrar el momento de transición.

**Racional**: El índice hace cumplir el máximo de un turno activo por servicio incluso si un escritor omite la capa de aplicación o si surge una carrera no prevista. El bloqueo transaccional es la coordinación normal; el índice filtrado es la garantía persistente final. La fecha/hora nullable distingue turnos aún no llamados sin cambiar registros históricos.

**Alternativas consideradas**:

- Un índice único de `(ServicioId, FechaTurno)` sería incorrecto porque la regla activa aplica entre días.
- Validar el estado en Application sin restricción SQL no garantizaría la unicidad bajo solicitudes simultáneas.

### Rechazos y respuestas

**Decisión**: El endpoint de llamado recibe el servicio en la ruta, sin permitir que el cliente elija el turno. Sin selección, la interfaz solicita elegir servicio y no envía la petición. Para un servicio válido, un turno activo existente se reporta como conflicto con instrucción de finalizar la atención actual; si no existe turno activo ni candidato del día, se reporta el mensaje de fila vacía y no se modifica información. Se proponen `409 Conflict` con códigos de problema distintos para los dos rechazos de negocio, conservando explícitamente la causa y sin tratarlos como error técnico.

**Racional**: Los dos conflictos impiden que se complete la operación solicitada por el estado actual del servicio. Códigos distintos permiten a la interfaz mostrar los mensajes establecidos por la especificación.

**Alternativas consideradas**:

- Devolver éxito con `null` ocultaría el motivo por el que no ocurrió el llamado.
- Un único mensaje para activo y fila vacía impediría explicar correctamente los casos expresamente distintos en la spec.

### Consulta de turno actual

**Decisión**: Exponer una lectura por `servicioId` que consulta cualquier turno del servicio con estado «En atención», sin limitarlo a la fecha de hoy. Devolver el turno actual cuando existe, y `turnoActual: null` para que la interfaz muestre «Ninguno» cuando no existe. Un servicio inexistente se distingue con `404`.

**Racional**: El estado activo de un turno anterior al día actual continúa bloqueando la llamada; consultar solo el día actual ocultaría el turno que impide continuar. La consulta no modifica datos.

**Alternativas consideradas**:

- Filtrar el turno actual por fecha excluiría una atención activa del día previo y contradiría el bloqueo persistente definido.
- Guardar una referencia redundante de turno actual en `Servicios` requeriría sincronización adicional; la tabla `Turnos` ya es fuente de verdad.

## Pruebas específicas

**Decisión**: Usar xUnit, pruebas de API y SQL Server según los planes previos. Probar reglas de transición en Domain; orden de selección y resultados de negocio en Application; índice, bloqueo, transacción, llamada concurrente y persistencia con SQL Server real; contratos y mensajes en pruebas HTTP; y la selección/mensajes en aceptación manual.

**Racional**: La garantía ante concurrencia depende de los bloqueos, transacciones e índice real de SQL Server; un repositorio simulado no prueba estas propiedades.

**Alternativas consideradas**:

- Probar solo la capa Domain no verifica que una segunda solicitud concurrente encuentre el turno ya activo ni que SQL impida duplicados.
- Probar solo la interfaz no demuestra atomicidad ni persistencia.

## Referencias del diseño específico

- [SPEC-04](./spec.md).
- [Plan y modelo de turnos de SPEC-02](../002-generar-turno/plan.md) y [data-model.md](../002-generar-turno/data-model.md).
- [Plan de consulta de fila SPEC-03](../003-consultar-fila-espera/plan.md).
- La forma de `sp_getapplock`, índice filtrado y transacción se describe en términos de las capacidades SQL Server necesarias para la decisión. La implementación debe validar sus opciones de bloqueo y errores con la versión de SQL Server adoptada por SPEC-01; no se amplía la regla funcional.
