# Investigación y decisiones de diseño: SPEC-05

## Alcance

SPEC-05 agrega el cierre de la atención del turno actual de un servicio. La estructura de solución, las capas, los proyectos, el acceso SQL Server con Dapper, la API REST, las pruebas y las entidades preexistentes se heredan de [SPEC-01](../001-registrar-servicios/plan.md) a [SPEC-04](../004-llamar-siguiente-turno/plan.md). No se duplican en esta investigación.

## Decisiones

### Estado final y regla de transición

**Decisión**: La operación de Domain permite únicamente `En atención` → `Finalizado`, asigna `FechaHoraFinalizacion` y rechaza cualquier otro origen. `Finalizado` es terminal y no admite otra transición.

**Racional**: La decisión explícita del equipo y los requisitos de la spec identifican «Finalizado» como estado y prohíben reabrirlo. La regla queda en Domain, no en Web ni únicamente en SQL.

**Alternativas consideradas**:

- Usar `Atendido` no coincide con la decisión expresa ni con RF-004, RF-007, RF-009 y los escenarios; se conserva `Finalizado`.
- Cambiar estado directamente desde el endpoint eludiría la regla del dominio.
- Crear transiciones desde `Finalizado` ampliaría el alcance.

### Marca temporal y conservación

**Decisión**: Agregar `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL` a `dbo.Turnos`. Infrastructure captura `SYSDATETIMEOFFSET()` del servidor dentro de la transacción y lo guarda solo al confirmar el cambio de estado. No modificar ni reemplazar `NumeroTurno`, `NombreCliente`, `FechaHoraGeneracion` o `FechaHoraLlamado`.

**Racional**: La columna nullable representa que el turno aún no se ha finalizado. El turno existente constituye el registro de atención; guardar la nueva marca junto al estado permite mantener la integridad de su historial.

**Alternativas consideradas**:

- Sobrescribir `FechaHoraLlamado` destruiría un dato de atención que debe conservarse.
- Guardar el registro en una tabla nueva duplicaría campos y requeriría sincronizar datos sin necesidad funcional.
- Usar la hora del navegador permitiría marcas que no corresponden al servidor operativo.

### Serialización de llamadas a finalizar

**Decisión**: En una transacción, adquirir el mismo `sp_getapplock` exclusivo por `ServicioId` que usa SPEC-04. Buscar el activo bajo ese bloqueo y actualizar condicionalmente solo si sigue `En atención` y su fecha de finalización es nula. Confirmar únicamente si se modificó exactamente una fila.

**Racional**: Dos peticiones simultáneas se ejecutan en secuencia lógica. La primera cambia el estado y confirma; la segunda obtiene el bloqueo después y encuentra que no hay turno en atención, por lo que responde con el rechazo previsto. El bloqueo compartido con SPEC-04 evita carreras entre finalizar y llamar el siguiente. La actualización condicional es una defensa adicional ante cambios no coordinados.

**Alternativas consideradas**:

- Leer fuera de una transacción o actualizar sin condición permite que solicitudes simultáneas crean que ambas finalizaron correctamente.
- Un bloqueo diferente del de SPEC-04 permitiría que una llamada y una finalización observaran estados incoherentes.
- Un indicador de finalización solo en memoria no sobrevive reinicios ni protege escrituras concurrentes.

### Fin del turno activo y disponibilidad del servicio

**Decisión**: Cambiar el estado del turno a `Finalizado` en la misma transacción de la marca final. El índice filtrado de SPEC-04 para `Estado = 'En atención'` deja de incluir la fila al confirmar; no se elimina el turno. El endpoint de turno actual ya existente debe entonces devolver `turnoActual: null`, y Web muestra «Ninguno».

**Racional**: El estado persistido ya representa qué turno está activo; una tabla o bandera adicional para disponibilidad sería redundante. El servicio queda libre sin destruir el registro finalizado.

**Alternativas consideradas**:

- Borrar el turno impediría conservar número, cliente y tiempos de atención.
- Guardar una referencia duplicada en `Servicios` requeriría mantener dos fuentes de verdad.
- Llamar automáticamente al siguiente contradice el alcance: la llamada es una acción separada según SPEC-04.

### API y rechazos

**Decisión**: Añadir `POST /api/servicios/{servicioId}/turnos/finalizar-atencion`, sin cuerpo ni `TurnoId`. Responder `200` con el turno finalizado; `404` para servicio inexistente y `409` con un código diferenciado cuando no hay turno en atención. Sin selección de servicio, la interfaz pide seleccionar y no envía petición.

**Racional**: La ruta establece el ámbito del servicio y evita que el cliente finalice otro turno. La selección ausente es una validación de la interfaz; el caso de servicio existente sin activo es un rechazo de negocio del endpoint.

**Alternativas consideradas**:

- Recibir `TurnoId` permitiría seleccionar un turno arbitrario en lugar del activo actual del servicio.
- Devolver éxito sin cambios ocultaría el motivo del rechazo.
- Usar el mismo mensaje para no seleccionar y no tener turno activo impediría distinguir la acción requerida.

### Pruebas

**Decisión**: Reutilizar xUnit, las pruebas HTTP y las pruebas SQL Server real de los planes anteriores. Verificar Domain, Application, API, integridad completa de los campos, persistencia tras recrear el host y dos finalizaciones simultáneas del mismo servicio. Realizar además aceptación manual con capturas.

**Racional**: Las pruebas de concurrencia requieren transacciones, bloqueos y persistencia reales; los dobles de prueba no prueban el comportamiento de SQL Server. La evidencia manual verifica confirmación y estado libre en la interfaz.

**Alternativas consideradas**:

- Probar solo Domain no demuestra atomicidad ni persistencia.
- Probar solo la UI no demuestra que la segunda finalización concurrente sea rechazada ni que se conserven las marcas temporales.

## Resolución de la discrepancia de estado

La entrada descriptiva de `spec.md` contiene una mención a «Atendido», mientras que las reglas funcionales, los escenarios de aceptación, los casos límite y los criterios de éxito usan «Finalizado». La decisión explícita del equipo para este plan también especifica «Finalizado». Se adopta `Finalizado` como único valor de estado en el diseño, el contrato y las pruebas. No se modifica `spec.md` en esta tarea.

## Referencias

- [Especificación SPEC-05](./spec.md).
- [Plan y modelo de turnos SPEC-02](../002-generar-turno/plan.md) y [data-model.md](../002-generar-turno/data-model.md).
- [Plan y modelo de llamada/turno actual SPEC-04](../004-llamar-siguiente-turno/plan.md) y [data-model.md](../004-llamar-siguiente-turno/data-model.md).
