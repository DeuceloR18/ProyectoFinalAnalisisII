# Guía rápida de validación: SPEC-01

Esta guía describe cómo validar el registro y la consulta una vez implementados los proyectos de [plan.md](./plan.md). La matriz completa de escenarios está en el plan y el contrato HTTP en [contracts/openapi.yaml](./contracts/openapi.yaml).

## Requisitos previos

- SDK de .NET 10 instalado (`dotnet --version` debe seleccionar un SDK `10.0.x`).
- Instancia de SQL Server accesible y base de datos de desarrollo creada.
- Herramienta `sqlcmd` disponible para aplicar el esquema, o un cliente SQL aprobado por el equipo.
- Cadena de conexión configurada localmente para el proyecto Web y los proyectos de prueba que requieran SQL Server; no almacenar secretos en el repositorio.
- Solución `ProyectoFinalAnalisisII.sln` en la raíz, con los proyectos previstos en `src/Servicio.Domain`, `src/Servicio.Application`, `src/Servicio.Infrastructure`, `src/Servicio.Web` y `tests/`.

## Preparar y ejecutar pruebas

Desde la raíz del repositorio, restaurar y ejecutar las pruebas xUnit:

```powershell
dotnet restore
dotnet test
```

**Resultado esperado**: pasan las pruebas de Domain y Application, los casos HTTP de Web y las pruebas de integración que usan la instancia SQL Server configurada. Las pruebas comprueban límites 100/5, valores vacíos, normalización, duplicados y persistencia.

## Validación HTTP

1. Aplicar a la base de datos el script versionado de creación de esquema que se defina bajo `src/Servicio.Infrastructure/Database/`.
2. Iniciar la aplicación:

   ```powershell
   dotnet run --project .\src\Servicio.Web\Servicio.Web.csproj
   ```

3. Consultar `GET /api/servicios`: debe responder `200` con una colección JSON; cuando no existan registros, el cuerpo debe ser `[]`.
4. Enviar `POST /api/servicios` con `{"nombre":"Consultas","prefijo":"c"}`: debe responder `201`, conservar el servicio y devolver el prefijo `C`.
5. Consultar nuevamente `GET /api/servicios`: debe aparecer el registro.
6. Repetir la creación con prefijo `C`: debe responder `409` con el código `prefijo_duplicado`; el listado debe permanecer sin cambios.
7. Enviar nombre vacío, nombre de 101 caracteres, prefijo vacío o prefijo de 6 caracteres: cada solicitud debe responder `400` con un mensaje claro asociado al campo y no agregar filas.

## Aceptación manual de la interfaz

1. Abrir la página `/servicios` en el navegador.
2. Capturar el estado vacío si la base no contiene servicios.
3. Registrar `Consultas` con prefijo `c`; capturar formulario, confirmación y fila mostrada como `C`.
4. Intentar un prefijo duplicado con diferencia de mayúsculas, un dato vacío, un nombre de 101 caracteres y un prefijo de 6 caracteres. Capturar el mensaje y el listado sin cambios para cada caso.
5. Cerrar y volver a iniciar la aplicación; capturar la lista con los datos existentes.
6. Verificar que las etiquetas del formulario son comprensibles y que el flujo se puede completar con teclado.

Guardar los resultados de pruebas y capturas con identificadores `RF01-AT-01` a `RF01-AT-08`, ligados a SPEC-01 y a la revisión probada. La evidencia no debe incluir credenciales ni datos personales.
