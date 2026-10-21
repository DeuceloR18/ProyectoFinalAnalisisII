# Plan de implementación: Registrar y consultar servicios de atención

**Rama actual**: `docs/plan-tareas` | **Fecha**: 2026-10-19 | **Especificación**: [spec.md](./spec.md) (SPEC-01)

## Resumen

Implementar el registro y la consulta persistente de servicios de atención. La aplicación normaliza y valida el nombre y el prefijo en Domain/Application; Web sirve la interfaz y expone la API REST que consume esa interfaz; Infrastructure persiste los datos en SQL Server mediante Dapper. La base de datos garantiza la unicidad del prefijo sin distinguir mayúsculas, incluso ante solicitudes concurrentes.

## Contexto técnico

**Lenguaje y versión**: C# con .NET 10 (`net10.0`); SDK 10.0.302 instalado en el equipo.

**Dependencias principales**: ASP.NET Core 10 para Web y API; Dapper y el proveedor de SQL Server de ADO.NET en Infrastructure; xUnit para pruebas.

**Persistencia**: SQL Server; acceso a datos exclusivo de Infrastructure y contratos de repositorio definidos en Application.

**Pruebas**: xUnit para reglas de Domain y casos de uso de Application; pruebas HTTP de la API; pruebas con SQL Server para unicidad y persistencia; aceptación manual de la interfaz con capturas.

**Plataforma objetivo**: aplicación web ASP.NET Core servida desde el proyecto Web.

**Tipo de proyecto**: aplicación web organizada en cuatro proyectos por capas, con interfaz y API en Web.

**Objetivos de rendimiento**: no se fija un objetivo de carga; el criterio observable de la spec es completar registro y localización en menos de un minuto en aceptación manual.

**Restricciones**: Domain no depende de ninguna capa; las reglas residen en Domain/Application; ningún acceso directo a datos fuera de Infrastructure; no agregar edición, eliminación, autenticación, roles ni pantallas públicas.

**Alcance**: entidad Servicio con nombre de hasta 100 caracteres y prefijo de hasta 5; ambos obligatorios. El prefijo se recorta, se normaliza a mayúsculas y es único sin distinguir capitalización. La lista se consulta en orden determinista y los datos sobreviven al reinicio.

## Comprobación de la constitución

| Principio | Resultado | Aplicación a SPEC-01 |
|---|---|---|
| Desarrollo guiado por especificaciones | Cumple | Este plan parte de SPEC-01; no genera tareas ni código. |
| Trazabilidad | Cumple | Los artefactos y las pruebas se identifican con SPEC-01/RF01. |
| Criterios verificables | Cumple | Cada escenario de aceptación se asocia a pruebas en la matriz de este plan. |
| Arquitectura en capas | Cumple | Se separan Domain, Application, Infrastructure y Web con dependencias hacia las abstracciones. |
| Alcance mínimo viable | Cumple | Solo se registran y consultan servicios. |
| Pruebas con evidencia | Cumple | xUnit y pruebas de API; las pruebas manuales UI conservarán capturas. |
| UX clara y accesible | Cumple | Formularios etiquetados, mensajes claros, estado vacío y navegación por teclado. |
| Uso responsable de IA | Cumple | El equipo revisará y validará los cambios asistidos antes de integrarlos. |
| Documentación bilingüe | Excepción solicitada | Esta entrega se redacta exclusivamente en español por instrucción expresa para SPEC-01. |
| Flujo de Git trazable | Excepción solicitada | Se permanece en `docs/plan-tareas`, según la instrucción de no crear ramas. No se cambia la rama. |

**Resultado de las puertas**: sin bloqueos técnicos ni requisitos pendientes de aclaración. Las excepciones de idioma y rama se limitan a esta solicitud expresa; no se modifica la constitución ni se realizan acciones de Git.

## Diseño por capas

### Domain

- Entidad `Servicio` con identificador, nombre y prefijo.
- Invariantes independientes de la infraestructura: nombre y prefijo no vacíos después de recortar espacios periféricos; nombre de hasta 100 caracteres; prefijo de hasta 5 caracteres.
- Normalización del prefijo a mayúsculas invariantes antes de persistir o comparar.
- No referencia ASP.NET Core, Dapper, SQL Server ni otros proyectos.

### Application

- Caso de uso para registrar un servicio: valida las invariantes, consulta el repositorio para una respuesta anticipada de duplicado y persiste el servicio.
- Caso de uso para consultar todos los servicios en orden estable.
- Interfaz `IServicioRepository` con operaciones de lectura de la colección, comprobación de prefijo y alta.
- Traduce una violación de unicidad de SQL Server al resultado de negocio «prefijo en uso»; no convierte fallos generales de base de datos en duplicados.
- Define resultados de validación/duplicado que Web puede traducir sin colocar reglas de negocio en los endpoints.

### Infrastructure

- Implementación Dapper de `IServicioRepository`.
- Administración de conexiones SQL Server y consultas parametrizadas.
- Esquema versionado de SQL Server para `dbo.Servicios`, con tamaños y restricción única descritos en [data-model.md](./data-model.md).
- La restricción/índice único en la base de datos es la garantía definitiva frente a escrituras simultáneas.
- Ordena el listado por prefijo y luego identificador para obtener resultados reproducibles.

### Web

- Único proyecto de interfaz y API: ASP.NET Core 10.
- Sirve la interfaz web en `/servicios`; la página usa solicitudes del mismo origen a `/api/servicios`, sin llamar directamente a Application ni a Infrastructure.
- Expone API REST JSON mediante endpoints Minimal API: `GET /api/servicios` y `POST /api/servicios`.
- Convierte los resultados de Application en códigos HTTP y mensajes/errores estructurados en español.
- Registra la composición de dependencias sin trasladar reglas de negocio a Web.
- La interfaz presenta formulario, confirmación, errores por campo, lista y estado vacío; usa etiquetas accesibles y permite el flujo completo con teclado.

## Estructura propuesta

El repositorio aún no contiene proyectos de aplicación: `src/` y `tests/` solo tienen marcadores. La siguiente estructura es propuesta para la implementación de SPEC-01:

```text
ProyectoFinalAnalisisII.sln
src/
├── Servicio.Domain/
├── Servicio.Application/
├── Servicio.Infrastructure/
│   └── Database/
└── Servicio.Web/

tests/
├── Servicio.Domain.Tests/
├── Servicio.Application.Tests/
└── Servicio.Web.Tests/
```

La solución de la raíz agrupa los proyectos de aplicación y pruebas. Los proyectos de pruebas cubren reglas de dominio, casos de uso y endpoints HTTP. Las pruebas que ejerciten la unicidad real y la persistencia usarán SQL Server, no un sustituto en memoria. Las capturas de aceptación se conservarán como evidencia vinculada a `RF01-AT-XX`, sin ampliar la estructura de producción.

## API y validaciones

La descripción normativa de solicitudes, respuestas y errores está en [contracts/openapi.yaml](./contracts/openapi.yaml).

| Endpoint | Comportamiento |
|---|---|
| `GET /api/servicios` | Devuelve `200 OK` y todos los servicios; devuelve `[]` si no hay registros. |
| `POST /api/servicios` | Recibe `nombre` y `prefijo`; devuelve `201 Created` y el servicio persistido si es válido. |

Validaciones aplicadas sobre los valores recortados:

1. Rechazar `nombre` vacío o compuesto solo por espacios; máximo 100 caracteres.
2. Rechazar `prefijo` vacío o compuesto solo por espacios; máximo 5 caracteres.
3. Guardar el prefijo normalizado en mayúsculas, sin distinguir capitalización para la unicidad.
4. Rechazar un prefijo duplicado con `409 Conflict`; la restricción única en SQL Server protege también ante concurrencia.
5. Rechazar datos faltantes, vacíos o fuera de longitud con `400 Bad Request`, indicando el campo y el motivo.
6. Mantener sin cambios la lista y los datos persistidos ante cualquier rechazo de negocio.

## Matriz de criterios de aceptación y pruebas

Cada fila corresponde a un escenario de aceptación de [spec.md](./spec.md). Las pruebas de API son pruebas HTTP automatizadas con xUnit; donde se indica persistencia/unicidad se usarán SQL Server real. Las capturas indicadas son evidencia manual adicional de la interfaz.

| Identificador | Criterio de aceptación | Prueba que lo verifica |
|---|---|---|
| RF01-AT-01 | Un registro válido aparece en la lista y muestra confirmación. | Prueba de caso de uso y `POST`/`GET` de API verifican persistencia, respuesta y contenido; aceptación UI con captura del formulario, confirmación y fila. |
| RF01-AT-02 | El prefijo `c` se guarda y muestra como `C`. | Prueba unitaria de normalización y prueba HTTP con consulta posterior; aceptación UI con captura del prefijo normalizado. |
| RF01-AT-03 | Nombre o prefijo vacío o solo con espacios se rechaza con mensaje y sin guardar. | Pruebas de reglas de Domain, respuesta `400` y consulta posterior sin alta; captura UI del mensaje y lista sin cambios. |
| RF01-AT-04 | Registrar `c` cuando ya existe `C` se rechaza como prefijo en uso y no guarda. | Prueba de caso de uso y prueba SQL Server/API de `409` bajo la restricción única; captura UI del error y lista sin duplicado. |
| RF01-AT-05 | Nombre de más de 100 caracteres o prefijo de más de 5 se rechaza con mensaje y sin guardar. | Pruebas de límites en Domain (100/5 aceptados; 101/6 rechazados), prueba HTTP para ambas entradas y consulta posterior sin altas; captura UI de cada límite excedido. |
| RF01-AT-06 | La consulta muestra todos los servicios con nombre y prefijo. | Prueba HTTP de `GET /api/servicios` con varios registros; aceptación UI con captura de la lista. |
| RF01-AT-07 | Una lista vacía se informa claramente. | Prueba HTTP verifica `200` con `[]`; aceptación UI con captura del estado vacío sin apariencia de error. |
| RF01-AT-08 | Los servicios siguen disponibles tras cerrar y volver a abrir la aplicación. | Prueba de integración con SQL Server escribe, crea una nueva instancia del host y consulta; aceptación UI tras reinicio con captura de los datos recuperados. |

Para las pruebas de rechazo, la evidencia debe demostrar tanto el mensaje como que la lista no cambió. Los resultados automatizados y las capturas quedarán asociados a SPEC-01 y a la revisión probada.

## Seguimiento del diseño

La investigación, el modelo, el contrato y la guía de validación se detallan en [research.md](./research.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml) y [quickstart.md](./quickstart.md). No se crea `tasks.md`: las tareas quedan fuera de esta etapa y de la solicitud.
