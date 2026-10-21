# Investigación y decisiones de diseño: SPEC-06

## Alcance

SPEC-06 agrega la cancelación confirmada de un turno individual en espera. Arquitectura, proyectos, SQL Server con Dapper, API y pruebas se heredan de [SPEC-01](../001-registrar-servicios/plan.md) a [SPEC-05](../005-finalizar-atencion/plan.md). La generación de turnos y su secuencia se rigen por SPEC-02; el filtrado, orden, total y posiciones de fila por SPEC-03; la transición a atención por SPEC-04; y el cierre de atención por SPEC-05.

## Decisiones

### Confirmación antes de la API

**Decisión**: La página de fila presenta una confirmación que muestra el número exacto del turno (por ejemplo, `C-003`). Solo la acción afirmativa envía `POST /api/turnos/{turnoId}/cancelar`; cerrar o rechazar el diálogo no realiza ninguna solicitud. La API no recibe un indicador de confirmación, porque su llamada ya representa la decisión confirmada.

**Racional**: La confirmación es una regla de interfaz explícita; cancelar el diálogo es una operación sin efectos. Mostrar el número reduce la posibilidad de confirmar un turno distinto.

**Alternativas consideradas**:

- Enviar primero la solicitud y pedir confirmación después podría modificar datos antes de que el recepcionista acepte.
- Enviar `confirmado: false` al endpoint desplazaría a la API una responsabilidad de interacción que pertenece a Web.

### Transición y rechazo por estado

**Decisión**: Domain permite exclusivamente `Esperando` → `Cancelado`, guardando `FechaHoraCancelacion`. `En atención`, `Finalizado` y `Cancelado` se rechazan sin mutar propiedades. Una reintención se informa como `turno_ya_cancelado`; los demás estados no cancelables se informan como `turno_no_esperando`.

**Racional**: La elegibilidad es una regla de negocio y debe aplicarse también cuando el estado cambia mientras el diálogo sigue abierto. El estado terminal evita duplicar operaciones y marcas.

**Alternativas consideradas**:

- Confiar en que la UI solo expone un botón para turnos esperando no protege frente a peticiones obsoletas.
- Hacer cancelación idempotente con éxito en el segundo intento ocultaría el rechazo requerido para un turno ya cancelado.

### Persistencia y número no reutilizable

**Decisión**: Añadir `FechaHoraCancelacion DATETIMEOFFSET(7) NULL` a `dbo.Turnos`; actualizar estado y marca en una transacción con hora obtenida del servidor. Mantener la fila y no modificar `dbo.ContadoresTurno`.

**Racional**: El registro original es la evidencia de que el número se emitió y canceló. SPEC-02 incrementa el correlativo al generar; no se revierte en una cancelación, así que el siguiente número sigue avanzando. La restricción única existente también conserva la identidad histórica del número.

**Alternativas consideradas**:

- Borrar el turno o decrementar el contador permitiría reutilizar el número y perdería trazabilidad.
- Sobrescribir horas de generación o llamado eliminaría información previa que debe conservarse.
- Usar el reloj del cliente no seguiría la fuente temporal del servidor.

### Exclusión de la fila

**Decisión**: Conservar la consulta existente de SPEC-03, que incluye únicamente `Estado = 'Esperando'`. Al persistir `Cancelado`, la fila no lo devuelve; `ROW_NUMBER()` y el total se calculan desde los turnos elegibles restantes y reflejan el cambio sin reordenar su secuencia de llegada.

**Racional**: El filtrado y las posiciones son una proyección de lectura, no datos a actualizar manualmente. Reutilizarlo evita reglas duplicadas y posiciones persistidas.

**Alternativas consideradas**:

- Eliminar manualmente elementos o decrementar posiciones en la base duplicaría la lógica de consulta y podría alterar el orden.
- Agregar un endpoint de fila alternativo ampliaría el alcance sin necesidad.

### Carrera entre cancelar y llamar

**Decisión**: Cancelación y llamada deben serializarse mediante el mismo bloqueo exclusivo de aplicación por `ServicioId` que define SPEC-04. Después de adquirir el bloqueo cada operación relee el estado y solo realiza su transición si la fila sigue `Esperando`. La petición de llamada debe además incluir el `TurnoId` esperado como precondición: no podrá seleccionar un turno distinto si el candidato mostrado cambió por una cancelación previa.

**Racional**: El bloqueo evita que las operaciones validen simultáneamente el mismo estado; la actualización condicional protege ante cambios no coordinados. Como el endpoint actual de SPEC-04 solo recibe el servicio y busca el siguiente candidato al ejecutarse, si cancelación ganara el bloqueo el llamado podría saltar a la siguiente fila; exigir el identificador esperado permite cumplir la decisión de que la operación concurrente perdedora sea rechazada para el mismo turno.

**Alternativas consideradas**:

- Solo un `UPDATE ... WHERE Estado = 'Esperando'` hace atómica la fila, pero no garantiza por sí mismo que el endpoint de llamada no avance a un turno diferente tras cancelar el primero.
- Usar dos bloqueos distintos permitiría que llamada y cancelación se vieran como concurrentes sin orden común.
- Cancelar después de la confirmación sin volver a validar el estado podría cancelar un turno ya llamado.

**Dependencia**: SPEC-04 debe aceptar el turno esperado como precondición y devolver conflicto claro si cambió. Este plan de SPEC-06 registra esa integración necesaria, pero por la instrucción de alcance no modifica los documentos de SPEC-04.

### Contrato y errores

**Decisión**: El endpoint es `POST /api/turnos/{turnoId}/cancelar`, sin cuerpo. Responde `200` con el turno cancelado, `404` si el turno no existe y `409` con códigos distintos si ya está cancelado o si su estado no es `Esperando`.

**Racional**: La identidad del turno se obtiene del elemento seleccionado y confirmado; no se acepta estado destino, fecha/hora ni un ID alternativo en el cuerpo. Las respuestas separan la ausencia del recurso de su estado incompatible.

**Alternativas consideradas**:

- Un endpoint de borrado no representaría la transición ni preservaría el registro.
- Un `200` para cualquier estado escondería intentos inválidos o confirmaciones obsoletas.

### Pruebas

**Decisión**: Reutilizar xUnit, pruebas HTTP, SQL Server real y aceptación manual. Probar transición de Domain, rechazo sin cambios, confirmación UI sin POST, fila y orden, no reutilización del correlativo, persistencia tras reinicio y carrera de cancelación/llamado bajo el bloqueo compartido.

**Racional**: La corrección de concurrencia depende del bloqueo/transacción de SQL Server; las pruebas de UI demuestran que una decisión negativa no llega a la API; las pruebas persistentes demuestran que el número sigue registrado.

**Alternativas consideradas**:

- Pruebas unitarias solas no demuestran la condición de carrera real.
- Probar solo la respuesta `200` no verifica fila, contador ni conservación.

## Referencias

- [Especificación SPEC-06](./spec.md).
- [Modelo y correlativo de turnos SPEC-02](../002-generar-turno/data-model.md).
- [Fila de espera SPEC-03](../003-consultar-fila-espera/data-model.md).
- [Llamado y bloqueo por servicio SPEC-04](../004-llamar-siguiente-turno/plan.md).
- [Finalización y transición terminal SPEC-05](../005-finalizar-atencion/plan.md).
