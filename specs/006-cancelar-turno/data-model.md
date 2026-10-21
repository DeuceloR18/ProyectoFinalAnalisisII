# Modelo de datos: SPEC-06

SPEC-06 extiende `dbo.Turnos` y la entidad `Turno` definidos en [SPEC-02](../002-generar-turno/data-model.md). La marca de llamado pertenece a SPEC-04 y la de finalización a SPEC-05. No se modifica `dbo.Servicios`, `dbo.ContadoresTurno` ni la estructura de la fila consultada de SPEC-03.

## Campo añadido a `Turno`

| Campo | Tipo de dominio | Columna SQL Server | Regla |
|---|---|---|---|
| Fecha y hora de cancelación | `DateTimeOffset?` | `FechaHoraCancelacion DATETIMEOFFSET(7) NULL` | Nula antes de cancelar; se asigna con la hora del servidor al confirmar `Esperando` → `Cancelado`. |

## Transición de estado

| Estado origen | Estado destino | Resultado |
|---|---|---|
| `Esperando` | `Cancelado` | Permitido únicamente tras la confirmación de UI y si sigue esperando al procesar la transacción; guardar `FechaHoraCancelacion`. |
| `En atención` | Ninguno | Rechazar; no modificar estado ni otras propiedades. |
| `Finalizado` | Ninguno | Rechazar; conservar íntegro el registro finalizado. |
| `Cancelado` | Ninguno | Rechazar segunda cancelación; conservar la fecha original y los demás datos. |

Domain implementa la validación de estado. Infrastructure la vuelve a comprobar en el estado actual persistido antes de actualizar para tratar de manera segura diálogos obsoletos y carreras.

## Conservación del registro y numeración

La cancelación actualiza la fila existente; no se borra ni se crea una nueva entidad:

- Se conserva `TurnoId`, `ServicioId`, `FechaTurno`, `Correlativo` y `NumeroTurno`.
- Se conserva `NombreCliente`, `FechaHoraGeneracion` y, si fue llamado, `FechaHoraLlamado`.
- Se escribe `Estado = 'Cancelado'` y `FechaHoraCancelacion`.
- `dbo.ContadoresTurno` no se decrementa ni modifica por cancelar.

El siguiente turno se genera según el contador de SPEC-02. Un número cancelado no vuelve a estar disponible y la restricción única de turnos continúa protegiendo el registro histórico.

## Efecto sobre la fila de espera

La fila es una proyección calculada al consultar según [SPEC-03](../003-consultar-fila-espera/data-model.md). La consulta conserva su filtro de servicio, fecha y `Estado = 'Esperando'`; no requiere escribir posiciones ni un indicador de fila:

1. El turno cancelado deja de pertenecer al conjunto elegible.
2. El total se calcula con las filas restantes y disminuye en uno.
3. `Posicion` se vuelve a calcular desde uno; los turnos posteriores reciben posiciones consecutivas.
4. El orden relativo se mantiene mediante el orden existente de fecha/hora de generación y correlativo.

## Integridad y concurrencia

1. La solicitud identifica un único `TurnoId`; la fila debe existir y seguir `Esperando`.
2. Estado y `FechaHoraCancelacion` se actualizan en una transacción y con una condición `Estado = 'Esperando'`.
3. Cancelación y llamado usan el mismo bloqueo exclusivo transaccional por servicio. La cancelación vuelve a leer el estado después de obtenerlo.
4. Para que un llamado concurrente no cambie a otro turno después de que la cancelación gane, el llamado compara el `TurnoId` esperado, además del estado. Esta coordinación requiere compatibilidad en el contrato de SPEC-04.
5. Solo una transición sobre el turno objetivo puede confirmar. La operación perdedora responde conflicto claro y no sobrescribe estado ni fechas.
6. La cancelación no actualiza filas de otros servicios ni el contador de SPEC-02.
