# Investigación y decisiones de diseño: SPEC-01

## Contexto

La especificación define el registro y consulta de servicios, valores obligatorios recortados, prefijo en mayúsculas, unicidad insensible a capitalización, persistencia entre ejecuciones y exclusión de edición/eliminación. La aclaración del equipo establece máximos de 100 caracteres para nombre y 5 para prefijo. El repositorio no contiene proyectos implementados en `src/` ni `tests/`; estas decisiones orientan una solución nueva.

## Decisiones

### Plataforma y arquitectura

**Decisión**: C# con `net10.0`, usando ASP.NET Core 10 en Web y cuatro proyectos: Domain, Application, Infrastructure y Web. La UI se sirve desde Web y consume la API REST del mismo origen.

**Racional**: .NET 10.0.302 está instalado en el equipo. ASP.NET Core permite servir una aplicación web y una API desde el mismo host, separando las rutas de páginas de las rutas JSON. Domain y Application mantienen las reglas y los casos de uso sin depender de Web ni de SQL Server.

**Alternativas consideradas**: Crear aplicaciones o despliegues separados para UI y API duplicaría composición y operación sin necesidad del alcance. Las rutas de páginas y JSON se mantienen separadas (`/servicios` y `/api/servicios`) para tener respuestas y errores apropiados para cada consumidor.

### Responsabilidades y persistencia

**Decisión**: SQL Server con Dapper. Application declara la interfaz del repositorio; Infrastructure implementa SQL y conexiones. Domain conserva entidad e invariantes. Web adapta HTTP y sirve la interfaz.

**Racional**: Sigue las decisiones técnicas explícitas del equipo y mantiene los detalles de persistencia fuera de las reglas de negocio. Dapper ejecuta SQL parametrizado y asigna resultados a tipos de C#; la capa no debe filtrar tipos de SQL Server a Domain/Application.

**Alternativas consideradas**: Acceso directo desde Web o desde Application a SQL Server viola la dirección de dependencias. Una consulta previa por sí sola no garantiza unicidad bajo concurrencia; por eso se conserva una restricción única en SQL Server y se traduce únicamente su conflicto específico a duplicado.

### Esquema y unicidad

**Decisión**: Tabla `dbo.Servicios`, con `Nombre NVARCHAR(100) NOT NULL`, `Prefijo NVARCHAR(5) NOT NULL` y clave primaria técnica. Aplicar una colación insensible a mayúsculas y sensible a acentos al prefijo y un índice único sobre esa columna. Recortar entradas y persistir el prefijo en mayúsculas.

**Racional**: Los límites concuerdan con la aclaración del equipo. La colación y el índice garantizan la regla de unicidad en SQL Server incluso si otra ruta de escritura omite la consulta previa o dos solicitudes compiten. La normalización canónica mantiene el dato visible en el formato exigido por SPEC-01.

**Alternativas consideradas**: Confiar solo en la normalización de aplicación o en una consulta `EXISTS` permite duplicados por carrera. Comparar conforme a una colación predeterminada no documentada hace que la regla dependa de la configuración de la base. Se especifica una colación explícita `Latin1_General_100_CI_AS` para que la sensibilidad a mayúsculas/acentos sea visible en el esquema.

### API y UX

**Decisión**: Usar `GET /api/servicios` y `POST /api/servicios`. El listado vacío es `200 OK` con `[]`; la creación válida devuelve `201 Created`; la validación devuelve `400 Bad Request`; un prefijo en uso devuelve `409 Conflict`. Usar respuestas `ProblemDetails` con mensajes en español para errores.

**Racional**: Los códigos distinguen datos inválidos del conflicto con el estado actual de la colección. La UI muestra el estado vacío de forma comprensible, confirma el alta y presenta el motivo asociado al campo. Se dejan fuera operaciones que la especificación excluye.

**Alternativas consideradas**: `404` para un listado vacío confunde una colección existente sin elementos con un recurso inexistente. Un formato de error propio añade otro contrato; `ProblemDetails` facilita respuestas consistentes.

### Pruebas y evidencia

**Decisión**: xUnit para reglas de Domain y casos de uso de Application; pruebas de API sobre el host HTTP; pruebas con SQL Server para restricción única y persistencia; aceptación manual de UI con capturas vinculadas a cada escenario.

**Racional**: Las pruebas unitarias dan feedback enfocado sobre reglas; las pruebas HTTP ejercitan serialización, rutas y estados; solo SQL Server comprueba el comportamiento de la colación e índice seleccionados. Las capturas muestran mensajes, formularios y estados de lista, sin sustituir aserciones automatizadas.

**Alternativas consideradas**: Un proveedor en memoria no demuestra la colación, índices ni persistencia del proveedor real. Una prueba manual aislada no detecta regresiones de API o casos límite.

## Aplicación de requisitos y límites

- Después de recortar espacios periféricos, nombre y prefijo no pueden quedar vacíos.
- Nombre: longitud máxima 100; prefijo: longitud máxima 5.
- Prefijo: normalización a mayúsculas y unicidad insensible a mayúsculas; la regla de base de datos usa colación sensible a acentos.
- Nombre no único; no se añaden patrones, roles, autenticación, edición, eliminación ni pantallas públicas.
- El listado debe tener orden determinista, por prefijo y luego por clave primaria.
- No se fija un objetivo de rendimiento de API: la especificación solo establece la aceptación manual de registro y localización en menos de un minuto.

## Referencias técnicas

- [Arquitecturas comunes de aplicaciones web en .NET](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)
- [ASP.NET Core: creación de API web](https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0)
- [Manejo de errores de API en ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api?view=aspnetcore-10.0)
- [Colaciones y compatibilidad con Unicode en SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/collations/collation-and-unicode-support?view=sql-server-ver16)
- [Restricciones únicas en SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-unique-constraints?view=sql-server-ver16)
- [Documentación del proyecto Dapper](https://github.com/DapperLib/Dapper)
- [Pruebas de integración de ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
- [Inicio con xUnit](https://xunit.net/docs/getting-started/v3/getting-started)
