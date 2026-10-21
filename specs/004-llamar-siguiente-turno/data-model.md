# Modelo de datos: SPEC-04

SPEC-04 amplía `dbo.Turnos` de [SPEC-02](../002-generar-turno/data-model.md) con la marca del llamado. No modifica el modelo de `dbo.Servicios` ni agrega entidades persistentes para el turno actual.

## Cambio en la entidad Turno

| Campo | Tipo de dominio | Columna SQL Server | Regla |
|---|---|---|---|
| Fecha y hora de llamado | `DateTimeOffset?` | `FechaHoraLlamado DATETIMEOFFSET(7) NULL` | `NULL` mientras no ha sido llamado. Se asigna con hora local del servidor al cambiar de «Esperando» a «En atención» y se conserva tras reinicios. |

El `Estado` y demás campos continúan según SPEC-02. La transición disponible en este alcance es únicamente:

| Estado origen | Estado destino | Condición |
|---|---|---|
| `Esperando` | `En atención` | Solo el turno elegible más antiguo del servicio y día actual, cuando no existe otro turno del servicio en `En atención`. Registrar `FechaHoraLlamado`. |

Domain debe rechazar cualquier llamada de un turno cuyo estado no sea `Esperando`. Esta spec no agrega transición de salida de `En atención`.

## Unicidad del turno en atención

Agregar a `dbo.Turnos` un índice único filtrado:

- Nombre: `UX_Turnos_UnSoloEnAtencionPorServicio`.
- Columna clave: `(ServicioId)`.
- Filtro: `Estado = 'En atención'`.

La restricción se aplica a todos los turnos de un servicio independientemente de `FechaTurno`, por lo que un turno activo de un día anterior bloquea otro. La transacción y bloqueo por servicio constituyen el flujo de concurrencia esperado; el índice es la garantía de integridad en la base de datos.

## Turno actual por servicio

El turno actual es una proyección leída de `dbo.Turnos`: el único registro del servicio con `Estado = 'En atención'`. No se mantiene una columna ni una tabla adicional en `dbo.Servicios`.

- Si existe, la respuesta incluye como mínimo `turnoId`, `numeroTurno`, `estado` y `fechaHoraLlamado`.
- Si no existe para un servicio registrado, se devuelve `turnoActual: null`; la interfaz lo presenta como «Ninguno».
- La búsqueda no filtra por fecha: un turno activo previo conserva su calidad de turno actual y sigue bloqueando una nueva llamada.
- La consulta es de solo lectura.

## Reglas de integridad

1. `ServicioId` debe corresponder a un servicio registrado.
2. El turno candidato debe pertenecer al servicio indicado, estar en `Esperando` y tener `FechaTurno` del día local actual del servidor.
3. El candidato más antiguo se elige por `FechaHoraGeneracion ASC`; el `Correlativo` numérico ascendente desempata.
4. Solo puede haber un estado `En atención` por servicio, incluidos turnos de otros días; SQL Server lo garantiza con el índice único filtrado.
5. La transición valida en Domain el estado origen `Esperando`; al confirmar, guarda `Estado = 'En atención'` y `FechaHoraLlamado`.
6. Sin candidato elegible, o ante un turno activo existente, el rechazo no altera el estado, fechas ni otros campos.
7. El llamado no permite proporcionar `TurnoId` o elegir manualmente un candidato desde el cliente.
