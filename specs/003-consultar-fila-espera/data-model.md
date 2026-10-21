# Modelo de datos: SPEC-03

La fila de espera es una proyección calculada en tiempo de consulta. No agrega tablas ni modifica las entidades persistidas de [SPEC-01](../001-registrar-servicios/data-model.md) o [SPEC-02](../002-generar-turno/data-model.md).

## Vista de aplicación: Fila de espera

| Campo de respuesta | Origen | Regla |
|---|---|---|
| `Posicion` | Calculado al consultar | Numeración consecutiva desde 1 en orden ascendente de `FechaHoraGeneracion`; para marcas iguales, `Correlativo` ascendente. No se persiste. |
| `NumeroTurno` | `dbo.Turnos.NumeroTurno` | Se devuelve sin modificar. |
| `NombreCliente` | `dbo.Turnos.NombreCliente` | Se devuelve cuando fue informado; si es `NULL`, la interfaz muestra solo el número. |
| `TotalEnEspera` | Conteo de filas elegibles en la misma consulta | Incluye exactamente las filas que aparecen para el servicio y fecha consultados; es 0 cuando no hay filas. |

La respuesta de la API agrupa los elementos y el total. Un servicio válido sin turnos elegibles produce una colección vacía y total 0. No existe una entidad persistente `FilaDeEspera`.

## Origen persistente

La consulta lee `dbo.Servicios` para distinguir el servicio inexistente de una fila vacía, y `dbo.Turnos` con los campos existentes:

- `ServicioId`: delimita el servicio seleccionado.
- `Estado`: debe ser exactamente `Esperando`.
- `FechaTurno`: debe ser igual a la fecha local actual del servidor SQL.
- `FechaHoraGeneracion`: orden primario, ascendente.
- `Correlativo DECIMAL(38,0)`: desempate numérico, ascendente.
- `NumeroTurno` y `NombreCliente`: datos devueltos en cada elemento.

El conjunto elegible no incluye turnos de otro servicio, otro día ni otro estado. Los estados que no sean `Esperando` quedan fuera del filtro.

## Índice de lectura

Agregar al esquema de turnos de SPEC-02 un índice no clúster para `dbo.Turnos`:

- Claves en orden: `(ServicioId, Estado, FechaTurno, FechaHoraGeneracion, Correlativo)`.
- Columnas incluidas: `(NumeroTurno, NombreCliente)`.

El prefijo del índice corresponde al filtro por servicio, estado y fecha; las claves posteriores soportan el orden de llegada y su desempate. No se crea una tabla de posiciones, no se actualizan contadores y la consulta no escribe datos.

## Reglas de resultado

1. `servicioId` identifica un servicio persistido; el servicio inexistente se devuelve como recurso no encontrado.
2. Para un servicio válido, el filtro incluye solo `Esperando` y `FechaTurno` del día local actual del servidor.
3. El orden es `FechaHoraGeneracion` ascendente y, en caso de empate, `Correlativo` ascendente.
4. La posición inicia en 1 y es calculada para cada lectura.
5. El total es la cantidad de elementos devueltos y es 0 si no hay elementos.
6. La consulta no modifica el estado ni ningún otro dato del servicio o los turnos.
