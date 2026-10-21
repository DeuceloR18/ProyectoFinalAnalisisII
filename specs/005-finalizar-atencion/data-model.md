# Modelo de datos: SPEC-05

SPEC-05 extiende la entidad `Turno` de [SPEC-02](../002-generar-turno/data-model.md), que SPEC-04 amplía con la marca temporal del llamado. No modifica `dbo.Servicios`, no agrega tablas ni elimina turnos.

## Cambio en `dbo.Turnos`

| Campo | Tipo de dominio | Columna SQL Server | Regla |
|---|---|---|---|
| Fecha y hora de finalización | `DateTimeOffset?` | `FechaHoraFinalizacion DATETIMEOFFSET(7) NULL` | Nula hasta que el turno transiciona a `Finalizado`; asignada con la hora del servidor al confirmar la transición. |

Los campos `ServicioId`, `NumeroTurno`, `NombreCliente`, `FechaHoraGeneracion`, `FechaHoraLlamado` y `Estado` conservan los tipos y restricciones establecidos por SPEC-01 a SPEC-04.

## Transición de estado

| Estado origen | Estado destino | Resultado |
|---|---|---|
| `En atención` | `Finalizado` | Guardar `FechaHoraFinalizacion` en la misma operación persistente. |
| Cualquier estado distinto de `En atención`, incluido `Finalizado` | Ninguno | Rechazar sin mutar el turno. |

Domain aplica esta regla. No existe transición para reabrir un turno finalizado. La operación de finalización no cambia la fecha/hora de generación o llamado.

## Registro finalizado

El registro se mantiene en la fila original de `dbo.Turnos`. Después de la transición conserva:

- Identidad y servicio del turno.
- Número asignado y nombre del cliente, que puede ser `NULL`.
- Estado `Finalizado`.
- `FechaHoraGeneracion`, `FechaHoraLlamado` y `FechaHoraFinalizacion`.

No se agrega un modelo histórico duplicado ni una consulta de historial fuera de lo necesario para probar la persistencia.

## Integridad y concurrencia

1. El turno que se finaliza es el que se encuentra `En atención` para el `ServicioId` solicitado; el cliente no elige un identificador de turno.
2. La transición solo se persiste si la fila aún está `En atención` y `FechaHoraFinalizacion IS NULL`.
3. Estado y fecha/hora de finalización se escriben dentro de la misma transacción.
4. La operación comparte con SPEC-04 el bloqueo exclusivo por servicio y mantiene la transacción hasta confirmar o revertir.
5. Si otra petición ya finalizó el turno, no se actualiza ninguna fila y se devuelve el resultado «sin turno en atención».
6. El índice único filtrado de SPEC-04 solo cubre filas `En atención`; al finalizar, la fila sale del filtro y libera el servicio, pero permanece almacenada.

No se agrega una restricción ni una regla de negocio adicional que impida la ausencia de nombre del cliente.
