# Investigación y decisiones de diseño: SPEC-03

## Alcance

SPEC-03 agrega una lectura de la fila de espera. La arquitectura, los proyectos, SQL Server con Dapper, la API REST y las convenciones de pruebas se heredan de los planes de [SPEC-01](../001-registrar-servicios/plan.md) y [SPEC-02](../002-generar-turno/plan.md). No se modifican los modelos persistentes de servicios o turnos.

## Decisiones

### Consulta de solo lectura

**Decisión**: Implementar la fila como una consulta del repositorio, sin escrituras, procedimientos de actualización ni cambios de estado. El número de posición se calcula en cada consulta y no se guarda.

**Racional**: La especificación define la fila como una vista temporal y prohíbe alterar los turnos al consultarlos. Volver a consultar debe reflejar los turnos elegibles que existen en ese momento.

**Alternativas consideradas**:

- Guardar la posición en cada turno duplicaría un dato derivable y podría quedar obsoleto al cambiar el conjunto de espera.
- Actualizar estados o contadores durante la lectura incumpliría el requisito de solo lectura.

### Filtro y fecha actual

**Decisión**: Filtrar por `ServicioId`, estado `Esperando` y `FechaTurno` igual a la fecha local actual del servidor SQL. La fecha del servidor se obtiene en SQL Server y se usa en la misma sentencia que consulta los turnos.

**Racional**: `FechaTurno` ya se deriva de la hora local del servidor al generar turnos en SPEC-02; reutilizarla al consultar mantiene el mismo límite de día y evita depender del reloj del navegador o de la aplicación.

**Alternativas consideradas**:

- La fecha del navegador puede no corresponder al servidor que determina el día de la secuencia.
- Consultar un intervalo de fechas de la aplicación puede divergir de la fecha local persistida por SPEC-02.

### Orden y posición

**Decisión**: Ordenar por `FechaHoraGeneracion` ascendente y por `Correlativo` numérico ascendente para desempatar, tal como define SPEC-03 y el modelo de SPEC-02. Calcular posición consecutiva desde 1 mediante una función de numeración de filas en la consulta.

**Racional**: El correlativo es el desempate definido por la especificación y su tipo SQL `DECIMAL(38,0)` conserva el orden numérico aunque el número presentado supere los tres dígitos mínimos.

**Alternativas consideradas**:

- Ordenar por el texto `NumeroTurno` puede ordenar incorrectamente números con distintas longitudes (`C-1000` antes de `C-999`).
- Persistir la posición haría que la consulta tuviera efectos secundarios y requeriría recalcular filas.

### Endpoint y servicio desconocido

**Decisión**: Exponer `GET /api/servicios/{servicioId}/fila-espera`. El identificador es un parámetro de ruta obligatorio. Un servicio inexistente se diferencia de uno existente sin turnos elegibles; el primero produce `404`, el segundo produce `200` con total cero y lista vacía. Si la interfaz no tiene selección, solicita elegir un servicio, no llama al endpoint y no conserva visualmente una fila anterior como si perteneciera a esa selección.

**Racional**: La ruta identifica explícitamente el ámbito de la consulta, y separar ausencia de servicio de una fila legítimamente vacía evita mostrar un resultado ambiguo. La interfaz cubre el caso sin selección, mientras la API solo recibe identificadores explícitos.

**Alternativas consideradas**:

- Devolver una lista vacía tanto para un servicio inexistente como para uno existente sin turnos elegibles ocultaría la condición de recurso inexistente.
- Un endpoint sin `servicioId` no identifica qué fila debe devolver.

### Índice de consulta

**Decisión**: Agregar en el esquema de SPEC-02 un índice no clúster para `dbo.Turnos`, con claves `(ServicioId, Estado, FechaTurno, FechaHoraGeneracion, Correlativo)` e inclusión de `NumeroTurno` y `NombreCliente`.

**Racional**: Las tres primeras claves apoyan el filtro requerido por servicio, estado y día; las siguientes claves apoyan el orden de llegada y el desempate. Las columnas incluidas permiten devolver los campos de fila sin consultar datos que no se necesitan.

**Alternativas consideradas**:

- Un índice solo por servicio obliga a filtrar estado y fecha leyendo más filas.
- Incluir `NumeroTurno` en lugar de `Correlativo` no garantiza el orden numérico correcto cuando el texto tiene anchos distintos.

## Pruebas específicas

**Decisión**: Usar xUnit según SPEC-01. Las pruebas de Application comprueban el caso de selección, servicio inexistente y respuesta vacía. Las pruebas de integración con SQL Server verifican filtro por servicio/estado/fecha, orden y desempate, posición y total, y que la consulta no produce cambios en datos. Las pruebas de API verifican el contrato HTTP; la aceptación manual aporta capturas de la fila, el estado vacío y el caso sin selección.

**Racional**: SQL Server debe comprobar el comportamiento del índice, las fechas y los tipos reales del modelo; las pruebas HTTP verifican la respuesta pública y la interfaz confirma que la información se presenta sin mostrar filas obsoletas.

**Alternativas consideradas**:

- Un proveedor en memoria no valida el filtrado, tipos, orden ni índice de SQL Server.
- Capturas manuales por sí solas no prueban con rigor que los datos persistidos no cambian.

## Fuentes del diseño

- Especificación y decisiones de este proyecto: [SPEC-03](./spec.md), [plan de SPEC-01](../001-registrar-servicios/plan.md), [plan de SPEC-02](../002-generar-turno/plan.md) y [modelo de turnos de SPEC-02](../002-generar-turno/data-model.md).
- La elección de `ROW_NUMBER`, `COUNT_BIG`, claves de índice y fecha del servidor se deriva de los requisitos del proyecto y de los tipos/columnas ya definidos en SPEC-02; no se agregan requisitos funcionales.
