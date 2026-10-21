# Modelo de datos: SPEC-02

Las entidades y datos persistentes específicos de la generación de turnos se describen aquí. `Servicio` y su clave primaria pertenecen a [SPEC-01](../001-registrar-servicios/data-model.md).

## Entidad: Turno

Una generación para un servicio existente. No incluye transiciones posteriores de estado ni operaciones históricas nuevas.

| Campo | Tipo de dominio | Columna SQL Server | Regla |
|---|---|---|---|
| Identificador | `long` | `TurnoId BIGINT IDENTITY(1,1)` | Clave primaria técnica. |
| Servicio | referencia a servicio existente | `ServicioId INT NOT NULL` | Clave foránea a `dbo.Servicios(ServicioId)`. |
| Fecha de secuencia | fecha calendario | `FechaTurno DATE NOT NULL` | Día local del servidor; se deriva de la marca de generación tomada en SQL Server. |
| Correlativo | texto decimal en la capa de dominio; número SQL interno | `Correlativo DECIMAL(38,0) NOT NULL` | Inicia en 1 por servicio y día; máximo 38 dígitos. La aplicación recibe el número presentado como texto para no perder precisión. |
| Número presentado | texto | `NumeroTurno NVARCHAR(44) NOT NULL` | Prefijo del servicio, guion y correlativo; mínimo tres dígitos para la parte correlativa. Ejemplos: `C-001`, `C-1000`. |
| Nombre de cliente | texto opcional | `NombreCliente NVARCHAR(100) NULL` | `NULL` si se omite, está vacío o solo tiene espacios; máximo 100 caracteres si se informa. |
| Estado | texto | `Estado NVARCHAR(20) NOT NULL` | Valor inicial `Esperando`. |
| Generado en | `DateTimeOffset` | `FechaHoraGeneracion DATETIMEOFFSET(7) NOT NULL` | Marca con el desfase local tomada del reloj del servidor durante la asignación; se usa para ordenar la llegada. |

## Tabla `dbo.Turnos`

- Clave primaria: `TurnoId`.
- Clave foránea: `ServicioId` referencia `dbo.Servicios(ServicioId)`. No se permite generar un turno para un servicio inexistente.
- Restricción única `UQ_Turnos_Servicio_Fecha_Numero` sobre `(ServicioId, FechaTurno, NumeroTurno)`. Evita que se repita el número presentado para un servicio y día.
- El correlativo y el número presentado deben generarse desde el mismo valor dentro de la operación transaccional. La relación entre ambos depende del prefijo del servicio y del formato acordado; no se aceptan números suministrados por el cliente.
- Índice recomendado para lectura ordenada por servicio: `(ServicioId, FechaTurno, FechaHoraGeneracion, Correlativo)`.
- Cada turno nuevo recibe `Estado = 'Esperando'`. El alcance de SPEC-02 no introduce otros estados ni sus transiciones.

## Tabla `dbo.ContadoresTurno`

Mantiene la secuencia por cada servicio y fecha, incluso si la aplicación se reinicia.

| Columna | Tipo SQL Server | Regla |
|---|---|---|
| `ServicioId` | `INT NOT NULL` | Parte de la clave primaria; referencia el servicio. |
| `FechaTurno` | `DATE NOT NULL` | Parte de la clave primaria; fecha local del servidor. |
| `UltimoCorrelativo` | `DECIMAL(38,0) NOT NULL` | Último valor asignado; comienza en 0 antes del primer turno. |

- Clave primaria compuesta: `(ServicioId, FechaTurno)`.
- Clave foránea `ServicioId` a `dbo.Servicios(ServicioId)`.
- El procedimiento de asignación coordina la creación e incremento; el acceso directo de escritura a esta tabla no forma parte de los contratos de aplicación.
- La fila contadora y la fila de `Turnos` se confirman o revierten en una misma transacción.

## Reglas de validación

1. `ServicioId` debe corresponder a un servicio persistido; ausente o inexistente implica rechazo y no inserta turno.
2. El nombre opcional vacío o solo con espacios se normaliza a no informado. Un nombre informado de más de 100 caracteres se rechaza antes de asignar el correlativo.
3. SQL Server obtiene una única fecha/hora local con desfase después de serializar la generación para el servicio; `FechaTurno` se deriva de esa misma marca.
4. El primer correlativo diario es 1; se incrementa por `(ServicioId, FechaTurno)`. Los días previos no se eliminan ni modifican.
5. La presentación usa al menos tres dígitos y agrega los dígitos necesarios hasta 38; el `DECIMAL(38,0)` constituye el máximo técnico aceptado.
6. Estado inicial constante: `Esperando`.

## Orden de llegada

El procedimiento captura la fecha/hora en la sección serializada del servicio y la guarda junto con el turno. Para ordenar turnos del mismo servicio y día, usar `FechaHoraGeneracion` ascendente y, si dos marcas coinciden por la precisión del reloj, `Correlativo` ascendente como desempate determinista.
