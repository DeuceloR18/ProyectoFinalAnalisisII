# Investigación y decisiones de diseño: SPEC-02

## Alcance

Este documento define solo las decisiones específicas para generar turnos. Las capas, la plataforma .NET, Dapper, la conexión SQL Server, el proyecto Web, las convenciones generales de API y xUnit se heredan de [SPEC-01 plan técnico](../001-registrar-servicios/plan.md); no se vuelven a definir aquí.

## Decisiones

### Correlativo diario y generación concurrente

**Decisión**: Mantener un contador persistente por `(ServicioId, FechaTurno)` y asignarlo en un procedimiento de SQL Server. El procedimiento abre una transacción, adquiere un bloqueo exclusivo de aplicación cuya clave corresponde al servicio, toma la hora local del servidor después de adquirir el bloqueo, obtiene de esa misma marca temporal la fecha, crea o incrementa el contador y guarda el turno antes de confirmar. El bloqueo se mantiene hasta el final de la transacción. Servicios diferentes pueden generar turnos en paralelo; generaciones del mismo servicio se serializan.

**Racional**: Un contador almacenado no depende de los turnos consultados ni pierde su estado al reiniciar la aplicación. El bloqueo de aplicación por servicio resuelve también el caso inicial en que aún no existe la fila contadora y hace que la fecha/hora se capture en el orden de asignación. La transacción hace atómicos el avance del contador y la inserción del turno: si falla el alta, el contador se revierte. La restricción única en `Turnos` protege como última defensa contra duplicados.

**Alternativas consideradas**:

- `MAX(correlativo) + 1` sobre los turnos sin bloqueo no es seguro: dos solicitudes pueden leer el mismo valor. Es posible protegerlo con aislamiento serializable y bloqueos de rango, pero depende de índices y predicados correctos, y consulta la tabla histórica en cada alta.
- Una tabla contadora con bloqueo de fila `UPDLOCK`/`HOLDLOCK` es viable; requiere tratar con cuidado la primera inserción concurrente cuando no existe una fila. El bloqueo transaccional por recurso de servicio simplifica ese caso.
- `IDENTITY` y `SEQUENCE` globales no reinician de forma natural por servicio y fecha.

### Hora del servidor y orden de llegada

**Decisión**: El procedimiento obtiene una única marca `SYSDATETIMEOFFSET()` del equipo que ejecuta SQL Server, después de serializar la solicitud del servicio. Deriva `FechaTurno` de esa marca local, y guarda la marca con su desfase en `FechaHoraGeneracion`. Si SQL Server está alojado en un entorno cuya hora no corresponde a la hora local del negocio, se debe configurar la zona horaria del servidor según la regla operativa acordada antes de desplegar.

**Racional**: Tomar fecha, hora y desfase juntas evita que una solicitud use una fecha de un reloj y una hora de otro. Capturar la marca dentro de la sección serializada hace coherente el correlativo con el orden de asignación en solicitudes simultáneas.

**Alternativas consideradas**: Usar el reloj del navegador o del cliente no es confiable para la fecha oficial. Enviar una hora capturada antes de esperar el bloqueo puede producir que el número asignado después tenga una hora anterior a la de otro turno del mismo servicio.

### Representación del número

**Decisión**: Conservar el correlativo en SQL Server como `DECIMAL(38,0)`, con ancho de presentación mínimo de tres dígitos. Formar el texto del turno con el prefijo existente del servicio, un guion y el correlativo decimal en formato invariable, agregando ceros solo si tiene menos de tres dígitos. No limitarlo a 999; por ejemplo, 1000 se presenta como `C-1000`. El valor se devuelve como texto desde el procedimiento para evitar convertir una precisión SQL de 38 dígitos al tipo `decimal` de .NET, cuya precisión es menor.

**Racional**: El equipo acepta 38 dígitos como máximo técnico; el ancho tres es un mínimo de presentación, no una longitud fija. Con el máximo de cinco caracteres del prefijo en SPEC-01, el número completo ocupa como máximo 44 caracteres.

**Alternativas consideradas**: `BIGINT` es más sencillo de mapear, pero ofrece solo hasta 19 dígitos y no aprovecha el máximo acordado. Guardar el correlativo como texto exige una lógica más compleja para incrementarlo y ordenarlo numéricamente.

### Nombre opcional del cliente

**Decisión**: Guardar el nombre en un campo nullable de hasta 100 caracteres. Un valor nulo, vacío o compuesto solo por espacios se considera no informado. Si contiene texto, conservarlo tal como fue recibido, sin imponer formato adicional; validar el máximo sobre el texto proporcionado y rechazar el turno si excede 100 caracteres.

**Racional**: Mantiene la opcionalidad existente y agrega el límite acordado. La validación se realiza antes de asignar el correlativo para evitar reservar números para una solicitud inválida.

**Alternativas consideradas**: Rechazar el turno por falta de nombre contradice la especificación. Truncar el nombre silenciosamente incumple el requisito de rechazo claro y puede asociar un dato distinto al que escribió el recepcionista.

### Pruebas específicas

**Decisión**: Aplicar xUnit según SPEC-01. Las pruebas nuevas de dominio y Application cubren longitud del nombre, nombre opcional, estado inicial y construcción del número. Las pruebas de Infrastructure/API ejercitan SQL Server real para la concurrencia, la restricción única, el cambio de fecha, el salto de 999 a 1000 y la persistencia tras recrear el host. La aceptación manual conserva capturas del número, confirmación y validación de nombre.

**Racional**: El proveedor SQL real es necesario para verificar bloqueos y restricciones. Las pruebas de UI demuestran la entrega legible al recepcionista, pero no sustituyen las aserciones de integridad transaccional.

## Referencias técnicas

- [Microsoft Learn: `sp_getapplock`](https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-getapplock-transact-sql): bloqueo de recursos de aplicación y alcance transaccional.
- [Microsoft Learn: `SYSDATETIMEOFFSET`](https://learn.microsoft.com/en-us/sql/t-sql/functions/sysdatetimeoffset-transact-sql): obtiene fecha, hora y desfase local del equipo que ejecuta Database Engine.
- [Microsoft Learn: restricciones únicas en SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-unique-constraints?view=sql-server-ver16): integridad única como garantía persistente.
- [Microsoft Learn: guía de bloqueo y control de versiones de transacciones](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide?view=sql-server-ver16): bloqueos y transacciones concurrentes.
- [Microsoft Learn: transacciones locales ADO.NET](https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/local-transactions): atomicidad al usar conexión y transacción.
- [Documentación del proyecto Dapper](https://github.com/DapperLib/Dapper): ejecución de comandos y procedimientos desde .NET.
