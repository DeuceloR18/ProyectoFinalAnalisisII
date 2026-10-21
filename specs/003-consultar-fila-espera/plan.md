# Plan de implementación: Consultar fila de espera

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md) (SPEC-03)

**Entrada**: [spec.md](./spec.md)

## Resumen

Agregar una consulta de solo lectura para la fila actual de un servicio. La consulta incluye únicamente sus turnos en estado «Esperando» y del día local actual del servidor; los ordena por fecha/hora de generación ascendente y usa el correlativo numérico como desempate. Posición y total se calculan al leer. No se añaden datos persistidos ni se modifica ningún turno.

## Contexto técnico

Las decisiones comunes de capas, proyectos, lenguaje y pruebas se heredan de [SPEC-01](../001-registrar-servicios/plan.md). La tabla y columnas de turnos se heredan de [SPEC-02](../002-generar-turno/plan.md) y [su modelo de datos](../002-generar-turno/data-model.md); este plan describe solo la consulta de fila.

**Lenguaje y versión**: Sin cambios respecto a SPEC-01.

**Dependencias principales**: Sin paquetes nuevos; se reutilizan las dependencias seleccionadas en SPEC-01.

**Almacenamiento**: Lectura de `dbo.Servicios` y `dbo.Turnos` existentes. No se añaden entidades ni cambios de datos persistentes. Se añade un índice de lectura en `dbo.Turnos` descrito abajo.

**Pruebas**: Mismo marco xUnit y pruebas API de SPEC-01; integración con SQL Server para comprobar el filtro, orden, total, índice y carácter de solo lectura; aceptación manual con capturas.

**Plataforma y proyectos**: Sin cambios respecto a SPEC-01. No se crean proyectos nuevos.

**Restricciones**: Solo lectura; no guardar posiciones ni implementar transiciones de estado, consulta automática, paginación o cambios funcionales ajenos a SPEC-03. La fecha elegible es la del servidor SQL en consistencia con SPEC-02.

**Dependencias funcionales**: SPEC-01 debe proveer servicios registrados. SPEC-02 debe proveer `dbo.Turnos`, `FechaTurno`, `FechaHoraGeneracion`, `Correlativo`, `NumeroTurno`, `NombreCliente` y `Estado`.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-03 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | El diseño deriva de SPEC-03 y sus dependencias definidas. |
| Trazabilidad | Cumple | Cada escenario de aceptación y criterio de éxito se vincula a pruebas y evidencia. |
| Criterios verificables | Cumple | Los diez escenarios y cinco criterios de éxito se cubren en la matriz de este plan. |
| Arquitectura en capas | Cumple | La lectura se declara en Application y se implementa solo en Infrastructure; Web expone la API y la interfaz. |
| Alcance mínimo viable | Cumple | No se añaden actualización automática, cambios de estado ni datos persistidos nuevos. |
| Pruebas con evidencia | Cumple | Pruebas xUnit, API/SQL Server y aceptación manual producen resultados y capturas. |
| UX clara y accesible | Cumple | La selección y el estado vacío se informan claramente; sin selección no se muestra una fila obsoleta. |
| Uso responsable de IA | Cumple | Cualquier implementación asistida se revisará y validará por el equipo. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta únicamente en español por instrucción expresa. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`; no se crea ni cambia ninguna rama. |

**Resultado de las puertas**: no hay aclaraciones funcionales pendientes. La consulta y las reglas de inclusión, orden, desempate y posición están especificadas; las decisiones técnicas reutilizan los dos planes anteriores.

## Diseño específico por capa

### Domain

- No se agregan entidades persistentes ni reglas de dominio nuevas.
- La proyección de fila es un modelo de lectura de aplicación; el dominio `Turno` existente no se modifica.

### Application

- Añadir el caso de uso de consulta `ConsultarFilaEspera`, que recibe el identificador seleccionado y solicita la fila actual al contrato de repositorio.
- Devolver elementos con posición, número y nombre opcional, junto con total.
- Representar de forma diferenciada servicio inexistente y consulta satisfactoria con cero resultados.
- No mutar entidades, asignar estados ni almacenar posiciones. La regla de orden y filtro se especifica en un único lugar de consulta Infrastructure; Application conserva la respuesta como resultado de lectura.

### Infrastructure y base de datos

- Implementar en `Servicio.Infrastructure` el método de lectura con Dapper.
- Consultar `dbo.Servicios` para identificar que el servicio existe y leer `dbo.Turnos` para el conjunto elegible.
- Filtrar `ServicioId`, `Estado = 'Esperando'` y `FechaTurno` igual a la fecha local actual de SQL Server obtenida mediante `SYSDATETIMEOFFSET()` en la sentencia.
- Calcular `Posicion` con `ROW_NUMBER()` ordenado por `FechaHoraGeneracion ASC, Correlativo ASC`; calcular el total del mismo conjunto con `COUNT_BIG() OVER()`. Si no hay turnos elegibles para un servicio existente, devolver cero y colección vacía. Si el servicio no existe, preservar el resultado «no encontrado».
- Usar una sola lectura SQL sin comandos de escritura; no persistir posiciones ni actualizar estado.
- Añadir al esquema de SPEC-02 un índice no clúster `IX_Turnos_FilaEspera` en `dbo.Turnos`, con claves `(ServicioId, Estado, FechaTurno, FechaHoraGeneracion, Correlativo)` e inclusión de `(NumeroTurno, NombreCliente)`. Las primeras claves apoyan el filtro; el sufijo apoya el orden.
- Verificar en pruebas de integración que el índice exista en el esquema de pruebas, que la consulta devuelve los datos esperados y que las filas consultadas no cambian.

### Web y API

- Añadir la pantalla de consulta de fila en el proyecto Web, servida en `/fila-espera`, y consumir la API del mismo origen.
- Reutilizar `GET /api/servicios` de SPEC-01 para seleccionar servicio.
- Exponer `GET /api/servicios/{servicioId}/fila-espera`.
- `servicioId` es un parámetro de ruta obligatorio. Un servicio inexistente devuelve `404` con mensaje claro; uno existente sin resultados elegibles devuelve `200` con `totalEnEspera: 0` y `elementos: []`.
- Si no se ha seleccionado servicio, la interfaz solicita selección, no consulta la API y no muestra datos de una consulta previa como si fueran actuales. Este caso no requiere una petición al endpoint.
- Cada elemento de respuesta expone `posicion`, `numeroTurno` y `nombreCliente` nullable; el objeto raíz expone `totalEnEspera` y `elementos`.
- La interfaz muestra el estado vacío como un resultado normal, presenta la posición/número/nombre disponibles y no actualiza datos de turnos.

## Estructura propuesta

Se reutilizan los proyectos existentes de SPEC-01 y la entidad persistida de SPEC-02; los nuevos componentes se limitan a la consulta:

```text
src/
├── Servicio.Application/
│   └── FilaEspera/
│       └── ConsultarFilaEspera.cs
├── Servicio.Infrastructure/
│   ├── Database/
│   │   └── 003-index-fila-espera.sql
│   └── FilaEspera/
│       └── SqlServerFilaEsperaRepository.cs
└── Servicio.Web/
    ├── Endpoints/
    │   └── FilaEsperaEndpoints.cs
    ├── Pages/
    │   └── FilaEspera/Index.cshtml
    └── wwwroot/js/fila-espera.js

tests/
├── Servicio.Application.Tests/
│   └── ConsultarFilaEsperaTests.cs
└── Servicio.Web.Tests/
    ├── Api/ConsultarFilaEsperaTests.cs
    └── Infrastructure/SqlServerFilaEsperaRepositoryTests.cs
```

La ruta del script se expresa como ampliación del directorio `Database` ya establecido. Si la secuencia de scripts de SQL Server cambia al implementar SPEC-03, conservar la numeración vigente sin alterar el alcance del índice.

## Consulta del repositorio

El contrato de Application expone una lectura de fila por `servicioId`; no acepta fecha del cliente ni datos de paginación no definidos por la spec. Infrastructure implementa la consulta mediante Dapper sobre SQL Server:

1. Validar que el servicio existe para diferenciar `404` de una fila vacía.
2. Seleccionar únicamente turnos donde coincidan el servicio, el estado «Esperando» y `FechaTurno` con el día local actual obtenido del servidor.
3. Ordenar cronológicamente por `FechaHoraGeneracion`; desempatar con `Correlativo` numérico ascendente.
4. Calcular posición desde 1 y total en la lectura, usando `ROW_NUMBER()` y `COUNT_BIG()` sobre el conjunto filtrado.
5. Proyectar `NumeroTurno` y `NombreCliente`; mantener `NULL` cuando no se informó el nombre.
6. Devolver total cero y lista vacía cuando el servicio existe pero no hay turnos elegibles.

La lectura debe funcionar sin efectos secundarios: no ejecutar `INSERT`, `UPDATE`, `DELETE` ni persistir resultados calculados.

## Contrato de API

El contrato normativo se define en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Método y ruta | Parámetros | Resultado |
|---|---|---|
| `GET /api/servicios/{servicioId}/fila-espera` | `servicioId` entero positivo obligatorio en la ruta. No recibe fecha ni filtros. | `200 OK` con `{ "totalEnEspera": 2, "elementos": [{ "posicion": 1, "numeroTurno": "C-001", "nombreCliente": "Ana Pérez" }] }`. Nombre puede ser `null`; lista vacía se representa como `totalEnEspera: 0` y `elementos: []`. |

**Caso de servicio inexistente**: `404 Not Found` cuando el identificador no corresponde a un servicio registrado. La falta de selección es un estado de interfaz: solicitar seleccionar un servicio y no enviar petición ni mostrar una fila previa.

## Matriz de criterios de aceptación y pruebas

Los escenarios reciben identificadores `RF03-AT-01` a `RF03-AT-10` en el mismo orden de aparición en SPEC-03. Guardar resultados y capturas bajo `specs/003-consultar-fila-espera/evidence/RF03-AT-XX/` o `evidence/CE-XXX/`.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF03-AT-01 | Mostrar turnos de espera del servicio ordenados desde el más antiguo, con posición, número y total. | Integración SQL Server/API prepara varias marcas y verifica orden, posición y total; captura manual de la fila completa. |
| RF03-AT-02 | Ordenar `C-001` antes de `C-002`, en posiciones 1 y 2. | Prueba de integración de repositorio verifica posiciones; prueba API confirma el JSON; captura manual de ambos números. |
| RF03-AT-03 | Mostrar nombre junto al turno cuando existe y solo número cuando no se informó. | Prueba API/SQL verifica nombre y `null`; aceptación UI captura ambos tipos de elemento. |
| RF03-AT-04 | Al volver a consultar después de generar otro turno elegible, incluirlo al final y aumentar total. | Prueba de integración genera un turno entre dos lecturas y compara fila/total; aceptación UI captura el resultado actualizado al consultar de nuevo. |
| RF03-AT-05 | Excluir turnos «En atención», «Finalizado» y «Cancelado» del listado y total. | Prueba de integración siembra cada estado y comprueba que solo se devuelven turnos «Esperando»; evidencia `.trx`. |
| RF03-AT-06 | Incluir únicamente turnos del servicio seleccionado. | Prueba de integración prepara dos servicios y verifica elementos y total aislados; prueba API con servicio elegido. |
| RF03-AT-07 | Incluir únicamente turnos del día actual del servidor. | Prueba SQL Server prepara turnos del día actual y anterior y verifica filtro mediante `FechaTurno`; evidencia `.trx`. |
| RF03-AT-08 | Para servicio sin turnos elegibles, devolver total 0 y mensaje de fila vacía. | Prueba API verifica `200`, total 0 y colección vacía; aceptación UI captura el mensaje vacío. |
| RF03-AT-09 | Sin servicio seleccionado, solicitar selección y no mostrar datos de turnos. | Prueba de interfaz verifica ausencia de solicitud API y de fila anterior; captura de la indicación de selección. |
| RF03-AT-10 | Consultar no modifica estado, fecha/hora, servicio, número ni nombre de los turnos. | Prueba de integración compara una instantánea de esos campos antes y después de repetir la consulta; aceptación guiada adjunta verificación. |
| CE-001 | El 100 % de los turnos elegibles aparece una vez y en orden por fecha/hora. | Consolidar resultados de RF03-AT-01, RF03-AT-02, RF03-AT-04 y RF03-AT-07 en `evidence/CE-001/resultado.md`. |
| CE-002 | El total coincide con el número de turnos elegibles, incluidas filas vacías. | Consolidar pruebas de RF03-AT-01 y RF03-AT-04 a RF03-AT-08 en `evidence/CE-002/resultado.md`. |
| CE-003 | Turnos de otro servicio, día o estado quedan excluidos de lista y total. | Consolidar pruebas de RF03-AT-05 a RF03-AT-07 en `evidence/CE-003/resultado.md`. |
| CE-004 | Las consultas dejan sin cambios los datos de turnos. | Adjuntar comparación antes/después de RF03-AT-10 en `evidence/CE-004/resultado.md`. |
| CE-005 | Seleccionar servicio, consultar e identificar quién sigue en menos de 30 segundos. | Aceptación manual cronometrada; guardar tiempo, contexto y captura en `evidence/CE-005/resultado.md`. |

## Referencias del diseño específico

- [Investigación y decisiones](./research.md)
- [Modelo de lectura](./data-model.md)
- [Contrato API](./contracts/openapi.yaml)
- [Guía de validación](./quickstart.md)

No se genera código ni `tasks.md` en esta etapa.
