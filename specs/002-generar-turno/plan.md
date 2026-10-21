# Plan de implementación: Generar turno

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md) (SPEC-02)

**Entrada**: [spec.md](./spec.md)

## Resumen

Agregar la generación de turnos para servicios existentes: nombre opcional de cliente limitado a 100 caracteres, número con prefijo y correlativo diario, estado inicial «Esperando», fecha/hora local del servidor y persistencia. La asignación concurrente se serializa en SQL Server por servicio dentro de una transacción; el contador y el turno se confirman o revierten juntos.

## Contexto técnico

Las decisiones comunes de lenguaje, capas, proyectos, interfaz, pruebas y herramientas se heredan de [SPEC-01 plan técnico](../001-registrar-servicios/plan.md) y no se duplican en este documento.

**Lenguaje y versión**: Sin cambios respecto a SPEC-01; consultar el plan referenciado.

**Dependencias principales**: Sin paquetes nuevos definidos; se agrega el procedimiento de asignación atómica y su invocación con las dependencias ya seleccionadas en SPEC-01.

**Almacenamiento**: Extiende la persistencia existente con `dbo.Turnos` y `dbo.ContadoresTurno`, relacionadas con `dbo.Servicios` de SPEC-01.

**Pruebas**: Mismo marco que SPEC-01; se agregan pruebas de concurrencia, fecha local del servidor, ciclo diario, límite de 38 dígitos, nombre de cliente y persistencia.

**Plataforma objetivo**: Sin cambios respecto a SPEC-01.

**Tipo de proyecto**: Funcionalidad adicional en la aplicación existente; no se crean proyectos nuevos.

**Metas de rendimiento**: La aceptación requiere que el recepcionista genere y lea un turno válido en menos de 30 segundos. No se fija un objetivo de carga; las solicitudes concurrentes para un servicio se serializan para preservar la secuencia.

**Restricciones**: Reutilizar las capas, nombres de proyecto, API Web y convenciones establecidos en SPEC-01. No generar código ni tareas en esta etapa. No crear ramas.

**Alcance**: Solo generar turnos para servicios existentes. No se añaden consulta histórica, edición, llamado, finalización, cancelación, impresión, pantallas públicas ni notificaciones.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-02 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | Se planifica a partir de SPEC-02 y su dependencia SPEC-01. |
| Trazabilidad | Cumple | Cada criterio RF02-AT queda vinculado a pruebas y evidencia en la matriz de este plan. |
| Criterios de aceptación verificables | Cumple | Los escenarios Dado/Cuando/Entonces se cubren con pruebas automatizadas y de aceptación. |
| Arquitectura en capas | Cumple | La capa y los proyectos se heredan del plan SPEC-01; solo se añaden responsabilidades de generación. |
| Alcance mínimo viable | Cumple | Solo se genera un turno, sin operaciones posteriores ni consulta histórica. |
| Pruebas con evidencia | Cumple | Pruebas xUnit/API y capturas manuales se asociarán a SPEC-02. |
| UX clara y accesible | Cumple | El formulario valida el servicio, indica si no hay servicios y confirma con claridad número y estado. |
| Uso responsable de IA | Cumple | El equipo revisará y validará cualquier implementación asistida. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta únicamente en español por instrucción expresa. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`; no se cambia ni crea ninguna rama. |

**Resultado de las puertas**: las decisiones funcionales solicitadas resuelven las reglas de nombre, formato, fecha/hora, estado y secuencia. El equipo acepta un máximo técnico de 38 dígitos para el correlativo; no queda una aclaración pendiente para este diseño.

## Diseño específico por capa

Se mantienen los proyectos y sus referencias según SPEC-01. Las responsabilidades nuevas para este incremento son:

### Domain

- Representar `Turno` con servicio, número, nombre opcional, fecha/hora de generación y estado.
- Definir el estado inicial «Esperando» y las reglas de nombre opcional: vacío o solo espacios equivale a no informado; más de 100 caracteres se rechaza.
- Construir/validar el resultado de número como prefijo, guion y correlativo con tres dígitos mínimos, hasta 38.
- Mantener Domain sin dependencias de transporte ni persistencia.

### Application

- Caso de uso `GenerarTurno`: validar cliente y servicio, solicitar la asignación atómica, y devolver el número y datos persistidos.
- Declarar en Application los contratos que necesita para consultar el servicio existente y generar el turno.
- No calcular el siguiente correlativo a partir de una lectura previa ni aceptar un número enviado por la interfaz.
- Diferenciar servicio inexistente, cliente inválido y éxito; propagar errores técnicos sin disfrazarlos de validación.

### Infrastructure y base de datos

- Implementar los contratos de Application mediante Dapper en `Servicio.Infrastructure`.
- Agregar tablas `dbo.Turnos` y `dbo.ContadoresTurno`, clave foránea a `dbo.Servicios`, unicidad `(ServicioId, FechaTurno, NumeroTurno)` y correlativo `DECIMAL(38,0)`.
- Implementar el procedimiento SQL de asignación transaccional. Adquirir un bloqueo de aplicación exclusivo y transaccional por servicio; después de adquirirlo, capturar una sola fecha/hora local con desfase del servidor mediante `SYSDATETIMEOFFSET()`; crear o incrementar el contador de esa fecha; insertar el turno con su número, estado y marca temporal; confirmar todo en una transacción.
- Revertir el contador si falla la inserción; no entregar ni mostrar el número hasta confirmar la transacción.
- Serializar asignaciones solo del mismo servicio; permitir que diferentes servicios avancen en paralelo.
- Devolver el correlativo y el número presentado como texto desde SQL Server, evitando conversión de `DECIMAL(38,0)` al `decimal` de precisión menor de .NET.

### Web y API

- Añadir en el proyecto Web la interfaz de `/turnos/generar`, que usa la API del mismo origen.
- Reutilizar `GET /api/servicios` de SPEC-01 para poblar la selección; si devuelve una lista vacía, informar que primero debe registrarse un servicio y no presentar una operación de alta habilitada.
- Añadir `POST /api/servicios/{servicioId}/turnos`; recibe solo `nombreCliente` opcional. El número, estado, fecha/hora y correlativo se asignan en servidor.
- Responder `201 Created` con el turno generado; `400 Bad Request` para nombre superior a 100 caracteres; `404 Not Found` para servicio inexistente; `409 Conflict` si se alcanza el máximo técnico del correlativo; y error técnico explícito en fallos de almacenamiento o de bloqueo.
- Mostrar el número, servicio, estado «Esperando» y confirmación; exponer errores claros en español, con controles accesibles por teclado.

## Estructura de implementación

Se reutiliza la solución y los proyectos descritos en [SPEC-01 plan técnico](../001-registrar-servicios/plan.md). Los nuevos archivos de funcionalidad se ubican en esos proyectos:

```text
src/
├── Servicio.Domain/
│   └── Turno.cs
├── Servicio.Application/
│   └── Turnos/
│       ├── GenerarTurno.cs
│       └── contratos de aplicación para servicios y turnos
├── Servicio.Infrastructure/
│   ├── Database/
│   │   ├── 002-create-turnos.sql
│   │   └── procedimiento de asignación atómica
│   └── Turnos/
│       └── SqlServerTurnoRepository.cs
└── Servicio.Web/
    ├── Endpoints/
    │   └── TurnosEndpoints.cs
    ├── Pages/
    │   └── Turnos/Generar.cshtml
    └── wwwroot/js/turnos.js

tests/
├── Servicio.Domain.Tests/
│   └── TurnoTests.cs
├── Servicio.Application.Tests/
│   └── GenerarTurnoTests.cs
└── Servicio.Web.Tests/
    ├── Api/GenerarTurnoTests.cs
    └── Infrastructure/SqlServerTurnoRepositoryTests.cs
```

Esta estructura amplía los proyectos de SPEC-01; no introduce una solución o capa adicional.

## Modelo y restricciones

El modelo completo y los tipos están en [data-model.md](./data-model.md). La clave de secuencia es `(ServicioId, FechaTurno)`. La restricción única de negocio en turnos usa `(ServicioId, FechaTurno, NumeroTurno)`; el número está determinado de forma unívoca por el servicio, su prefijo y el correlativo. El estado de todo registro nuevo es «Esperando».

`FechaHoraGeneracion` y `FechaTurno` provienen de una marca local única con desfase de SQL Server tomada mientras la asignación de ese servicio está serializada. Configurar la zona horaria del servidor para que represente la zona operativa del establecimiento.

## Contrato de API y validaciones

El contrato JSON completo se define en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Método y ruta | Propósito | Resultado |
|---|---|---|
| `GET /api/servicios` | Reutiliza el listado de SPEC-01 para elegir el servicio. | `200 OK` con la colección; `[]` indica que primero debe registrarse un servicio. |
| `POST /api/servicios/{servicioId}/turnos` | Genera un turno; cuerpo opcional `{"nombreCliente":"..."}`. | `201 Created` con el turno persistido y el número asignado. |

Validaciones y fallos:

1. `servicioId` debe resolver a un servicio persistido; si no, `404`, mensaje claro y sin turno.
2. Sin servicios en el listado, la interfaz indica que debe registrarse un servicio primero; ninguna creación se realiza.
3. Nombre omitido, vacío o compuesto solo por espacios equivale a no informado y permite la generación.
4. Nombre informado mayor a 100 caracteres se rechaza con `400` antes de abrir la asignación del correlativo.
5. El cliente no proporciona fecha, número, correlativo ni estado; son generados por el servidor.
6. El correlativo empieza en `001`, incrementa por servicio y fecha, se reinicia en el día local nuevo y se expande tras `999` (por ejemplo, `C-1000`) hasta 38 dígitos.
7. La transacción de asignación impide duplicados concurrentes; `UQ_Turnos_Servicio_Fecha_Numero` protege la persistencia.
8. El estado inicial es «Esperando» y la fecha/hora registrada corresponde a la generación en el servidor.
9. Si el correlativo del día ya alcanzó 38 dígitos, devolver un conflicto claro sin insertar un turno ni alterar el contador.

## Matriz de criterios de aceptación y pruebas

Cada escenario de aceptación y cada criterio de éxito de [spec.md](./spec.md) tiene una prueba automatizada xUnit o de integración de API/SQL Server, además de aceptación manual cuando la salida se observa en la interfaz. Guardar resultados automatizados y capturas bajo `specs/002-generar-turno/evidence/RF02-AT-XX/` o `evidence/CE-XXX/`.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF02-AT-01 | Un servicio existente genera `C-001`, estado «Esperando», fecha/hora, número visible y confirmación. | Prueba de caso de uso y POST/API con SQL Server verifica número, estado, marca temporal e inserción; aceptación UI captura el número y confirmación. |
| RF02-AT-02 | Sin seleccionar servicio, la generación se rechaza sin crear turno. | Prueba API de ruta/cuerpo sin servicio válido y consulta SQL posterior; aceptación UI captura validación y estado sin cambios. |
| RF02-AT-03 | Si no hay servicios, se indica registrar uno primero y no se crea turno. | Prueba API verifica listado de servicios vacío y rechazo de alta para identificador inexistente; aceptación UI captura el aviso y formulario sin opción válida. |
| RF02-AT-04 | El mismo servicio avanza de `C-001` a `C-002` en el mismo día. | Prueba de integración crea dos turnos secuenciales en SQL Server y compara correlativos; aceptación UI captura ambos números. |
| RF02-AT-05 | Servicios distintos comienzan independientemente en `001`. | Prueba de integración genera el primer turno de dos servicios y comprueba sus prefijos y correlativos; aceptación UI captura ambas asignaciones. |
| RF02-AT-06 | El primer turno del servicio en un nuevo día reinicia a `001`, conservando el día previo. | Prueba de integración siembra una fila contadora del día anterior, genera el turno del día actual y comprueba `001` y la conservación del anterior; aceptación guiada verifica el resultado en el entorno de prueba. |
| RF02-AT-07 | Cada turno guarda fecha/hora para ordenar llegada. | Prueba de SQL/API verifica marcas `FechaHoraGeneracion` y orden ascendente, con correlativo como desempate; aceptación UI captura el orden de emisión. |
| RF02-AT-08 | Después de `C-999`, el siguiente número es `C-1000`. | Prueba de unidad del formato y prueba de integración con contador preparado en `999`; aceptación UI captura el número expandido. |
| RF02-AT-09 | Un nombre proporcionado queda asociado al turno. | Prueba API/SQL verifica el nombre persistido y devuelto; aceptación UI captura el número y el nombre asociado. |
| RF02-AT-10 | Nombre vacío o solo con espacios permite generar sin nombre informado. | Prueba de Domain/Application/API verifica persistencia con `NULL`; aceptación UI captura una generación sin nombre. |
| RF02-AT-11 | Tras reiniciar la aplicación, el turno mantiene número, servicio, estado, fecha/hora y nombre cuando se informó. | Prueba de integración registra, recrea el host y consulta persistencia en SQL Server; aceptación manual reinicia el host y verifica la fila persistida en la base de prueba, sin añadir una consulta histórica a la interfaz. |
| RF02-AT-12 | Nombre de cliente de más de 100 caracteres se rechaza con mensaje claro y no crea turno. | Prueba de Domain y API verifica rechazo de 101 caracteres, respuesta `400` y ausencia de fila; aceptación UI captura error y lista/estado sin cambios. |
| CE-001 | El 100 % de las generaciones válidas muestra el prefijo y número correctos, el estado «Esperando» y una confirmación. | Pruebas de aceptación de RF02-AT-01, RF02-AT-04 y RF02-AT-08; registrar el resultado total y capturas en `evidence/CE-001/resultado.md`. |
| CE-002 | El 100 % de las secuencias incrementa por servicio/día, comienza en `001` y se reinicia al cambiar el día. | Pruebas de integración de RF02-AT-04 a RF02-AT-06, incluida concurrencia; consolidar resultados en `evidence/CE-002/resultado.md`. |
| CE-003 | El 100 % de los intentos sin un servicio válido se rechaza con mensaje comprensible y sin crear turnos. | Pruebas de RF02-AT-02 y RF02-AT-03 comprueban respuesta, mensaje y ausencia de filas; consolidar evidencia en `evidence/CE-003/resultado.md`. |
| CE-004 | El 100 % de los turnos sobrevive al reinicio con número, servicio, estado, fecha/hora y nombre si se informó. | Prueba de integración y verificación manual de RF02-AT-11; consolidar evidencia en `evidence/CE-004/resultado.md`. |
| CE-005 | El recepcionista genera un turno válido y lee su número en menos de 30 segundos. | Aceptación manual cronometrada en la UI, desde selección de servicio hasta lectura del número; guardar tiempo y captura en `evidence/CE-005/resultado.md`. |

**Prueba de concurrencia adicional**: lanzar solicitudes simultáneas para el mismo servicio y verificar que cada respuesta contiene un número distinto, que el conjunto es secuencial y que la restricción única no detecta duplicados; repetir con servicios distintos para verificar que no comparten correlativo. Esta prueba apoya RF02-AT-04 y RF02-AT-05 y conservará evidencia bajo `evidence/RF02-AT-04/concurrencia.trx`.

## Referencias del diseño específico

- [Investigación de generación segura](./research.md)
- [Modelo de datos](./data-model.md)
- [Contrato API](./contracts/openapi.yaml)
- [Guía de validación](./quickstart.md)

No se genera `tasks.md` ni código en esta etapa.
