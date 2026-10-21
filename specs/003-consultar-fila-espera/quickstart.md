# Guía rápida de validación: SPEC-03

Esta guía valida la consulta descrita en [plan.md](./plan.md). La solución, proyectos, SQL Server/Dapper, API y convenciones de pruebas se heredan de [SPEC-01](../001-registrar-servicios/plan.md) y [SPEC-02](../002-generar-turno/plan.md).

## Requisitos previos

- SDK .NET 10 y la solución `ProyectoFinalAnalisisII.sln` con los proyectos compartidos.
- SQL Server de prueba con los esquemas de SPEC-01 y SPEC-02 aplicados y el índice de consulta de SPEC-03 creado.
- Cadena de conexión de pruebas en `SPEC02_SQLSERVER_CONNECTION`; apuntar exclusivamente a una base aislada.
- Servicios y turnos ficticios disponibles para el servicio consultado. Preparar casos de distinto estado, servicio y día en la base de prueba, sin usar información personal real.
- Configuración de hora local de SQL Server alineada con la regla de día local usada al generar turnos en SPEC-02.

## Ejecutar pruebas automatizadas

Desde la raíz de la solución:

```powershell
dotnet test .\ProyectoFinalAnalisisII.sln --logger "trx;LogFileName=SPEC03-tests.trx"
```

**Resultado esperado**: xUnit y las pruebas con SQL Server verifican filtrado por servicio/fecha/estado, orden y desempate, posiciones consecutivas, total correcto, fila vacía, servicio inexistente, respuesta HTTP y ausencia de cambios persistidos. Guardar el resultado en `specs/003-consultar-fila-espera/evidence/`.

## Validación de API

Consultar una fila para un servicio existente:

```powershell
Invoke-RestMethod -Method Get -Uri "$env:SPEC03_BASE_URL/api/servicios/1/fila-espera"
```

Resultado esperado: `200 OK` con `totalEnEspera` y `elementos`; cada elemento contiene posición, número y nombre opcional. Las posiciones empiezan en 1, el orden es por hora de generación ascendente y el correlativo ascendente resuelve empates.

Casos adicionales en la base de prueba:

1. Un servicio existente sin turnos elegibles devuelve `200`, `totalEnEspera: 0` y `elementos: []`.
2. Un identificador de servicio inexistente devuelve `404` con mensaje claro.
3. La consulta excluye estados distintos de `Esperando`, turnos de otro servicio y turnos de días distintos al actual del servidor.
4. Un turno sin nombre devuelve `nombreCliente: null`; la interfaz presenta su número sin un nombre.
5. Repetir la solicitud produce la fila actual y no altera las filas ni sus datos persistidos.

## Aceptación manual de interfaz

1. Abrir la pantalla de consulta de fila y verificar que los servicios registrados se pueden seleccionar.
2. Seleccionar un servicio con turnos elegibles; comprobar posición, número, nombre cuando existe y total, con orden del más antiguo al más reciente.
3. Probar la fila vacía y comprobar total 0 con mensaje claro, sin presentarla como error.
4. Sin seleccionar un servicio, intentar consultar; verificar la indicación de selección, que no se llama a la API y que no se presenta información de una selección anterior.
5. Comparar los datos persistidos antes y después de consultar, comprobando que la lectura no cambió estado, servicio, número, fecha/hora ni nombre.
6. Medir la selección del servicio y la identificación de quién sigue; guardar el tiempo y una captura para CE-005.

Guardar capturas y una nota breve de resultado en `specs/003-consultar-fila-espera/evidence/RF03-AT-XX/` y `evidence/CE-XXX/`. No agregar actualización automática, transiciones de estado ni reglas que no pertenezcan a la especificación.
