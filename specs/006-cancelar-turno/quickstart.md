# Guía rápida de validación: SPEC-06

Esta guía valida únicamente cancelar y confirmar un turno. La solución, proyectos, datos de servicio, generación, fila y llamado se preparan mediante SPEC-01 a SPEC-05.

## Requisitos previos

- SDK .NET 10 y solución `ProyectoFinalAnalisisII.sln`.
- SQL Server de prueba aislado con esquemas de SPEC-01 a SPEC-05 y `FechaHoraCancelacion` de SPEC-06 aplicada.
- Variable `SPEC02_SQLSERVER_CONNECTION` configurada a la base de prueba; host de prueba en `SPEC06_BASE_URL`.
- Servicios ficticios y turnos esperando C-001, C-002 y C-003 creados por los flujos anteriores.
- Para validar no reutilización, conservar el contador del servicio/día; no reiniciarlo tras cancelar.
- El bloqueo por servicio de cancelación debe ser compartido con llamado SPEC-04. La precondición del turno esperado en el contrato de llamado es necesaria para aprobar la prueba cancelar/llamar simultáneamente.

## Ejecutar pruebas automatizadas

Desde la raíz:

```powershell
dotnet test .\ProyectoFinalAnalisisII.sln --logger "trx;LogFileName=SPEC06-tests.trx"
```

**Resultado esperado**: xUnit valida `Esperando` → `Cancelado` y el rechazo de estados no cancelables; pruebas API/SQL Server verifican que se persiste la hora, se conserva el número y no se reutiliza, la fila excluye el turno y el número de llamadas/cancelaciones concurrentes produce una sola transición aceptada. Guardar `.trx` y resultado bajo `specs/006-cancelar-turno/evidence/`.

## Validación manual de confirmación

1. Abrir la página de fila de espera y seleccionar un servicio con varios turnos `Esperando`.
2. En C-002 elegir «Cancelar». Verificar que el diálogo muestra `C-002` y ofrece confirmar o cerrar.
3. Cerrar el diálogo. Verificar que no se envió la API y C-002 sigue en espera con todos sus datos iguales.
4. Abrir de nuevo el diálogo y confirmar. Verificar la confirmación de cancelación y que, tras volver a consultar, la fila contiene C-001 y C-003 en ese orden, con posiciones 1 y 2 y total reducido en uno.
5. Si el flujo de interfaz/servicio permite una solicitud de cancelación después de que C-002 dejó de esperar, comprobar que la respuesta es conflicto y no presenta éxito.

Guardar capturas del diálogo abierto, cancelación del diálogo y resultado confirmado bajo `specs/006-cancelar-turno/evidence/RF06-AT-01/` y `RF06-AT-02/`.

## Validación API y persistencia

La confirmación ya ocurrió en la interfaz; la API no recibe un campo de confirmación:

```powershell
Invoke-RestMethod -Method Post -Uri "$env:SPEC06_BASE_URL/api/turnos/42/cancelar"
```

**Resultado esperado**: `200` con el mismo `turnoId`, servicio y número, estado `Cancelado` y `fechaHoraCancelacion`. El registro queda en SQL Server; `FechaHoraGeneracion`, `FechaHoraLlamado`, nombre, número y contador conservan sus valores.

Comprobar además:

1. Identificador de turno inexistente: respuesta `404 turno_no_encontrado`.
2. Cancelación repetida: respuesta `409 turno_ya_cancelado`; comparar la fecha de cancelación original y todas las columnas antes/después.
3. Turno `En atención` o `Finalizado`: respuesta `409 turno_no_esperando` sin cambios en su registro.
4. Cancelar C-002 de C-001/C-002/C-003: la consulta de fila SPEC-03 devuelve C-001 posición 1 y C-003 posición 2, total menos uno.
5. Después de cancelar el correlativo 002, generar un nuevo turno del mismo servicio/día y comprobar que el contador sigue avanzando; no debe asignarse C-002 de nuevo.
6. Cerrar y recrear el host y comprobar en SQL Server que C-002 permanece `Cancelado` con su hora de cancelación.
7. Abrir la confirmación para un turno esperando, cambiarlo a `En atención` mediante la ruta de llamado y luego confirmar la cancelación; la cancelación debe rechazarse y no sobreescribir la llamada.

## Prueba simultánea de llamada y cancelación

Con SQL Server real, preparar un turno esperado único para el escenario y lanzar a la vez la cancelación confirmada y una llamada condicionada a ese mismo `TurnoId`. Comprobar que una operación confirma la transición y la otra recibe un conflicto; no puede llamarse otra fila en nombre de la petición obsoleta. Repetir con el orden de adquisición invertido si el arnés lo permite. Guardar resultado y diagnóstico del estado en `specs/006-cancelar-turno/evidence/RF06-AT-09/concurrencia.trx`. Si el endpoint de SPEC-04 no admite aún el turno esperado, marcar esta validación como bloqueada por dependencia y no como aprobada.

## Evidencia por criterios de éxito

Conservar las pruebas y capturas bajo `specs/006-cancelar-turno/evidence/RF06-AT-XX/` y `evidence/CE-XXX/`. Medir CE-006 desde la identificación del turno hasta aceptar o rechazar el diálogo y registrar duración real, escenario y resultado. Usar exclusivamente datos ficticios; no guardar credenciales en evidencias.
