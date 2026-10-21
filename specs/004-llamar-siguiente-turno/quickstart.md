# Guía rápida de validación: SPEC-04

La solución, proyectos, SQL Server/Dapper, host Web, pruebas y servicios/turnos se heredan de [SPEC-01](../001-registrar-servicios/plan.md), [SPEC-02](../002-generar-turno/plan.md) y [SPEC-03](../003-consultar-fila-espera/plan.md). Esta guía valida únicamente el llamado y la lectura del turno actual.

## Requisitos previos

- SDK .NET 10 y solución `ProyectoFinalAnalisisII.sln` con proyectos compartidos.
- SQL Server de prueba con esquemas de SPEC-01/SPEC-02 y cambio de SPEC-04 aplicados: `FechaHoraLlamado` e índice único filtrado.
- `SPEC02_SQLSERVER_CONNECTION` configurada hacia una base aislada de pruebas.
- Servicios y turnos ficticios preparados. Para probar turno activo de día anterior, prepararlo en esta base y no en un entorno compartido.
- El reloj y la zona local de SQL Server deben seguir la configuración establecida para SPEC-02.

## Ejecutar pruebas automatizadas

Desde la raíz:

```powershell
dotnet test .\ProyectoFinalAnalisisII.sln --logger "trx;LogFileName=SPEC04-tests.trx"
```

**Resultado esperado**: pruebas xUnit verifican la transición Domain desde `Esperando`, el orden de selección y las reglas de Application. Pruebas de integración SQL Server verifican el índice único filtrado, la atomicidad, la persistencia, el bloqueo de un turno activo previo y solicitudes simultáneas. Guardar el `.trx` y notas en `specs/004-llamar-siguiente-turno/evidence/`.

## Validación de API

Para un servicio de prueba con turnos elegibles y sin atención activa:

```powershell
Invoke-RestMethod -Method Post -Uri "$env:SPEC04_BASE_URL/api/servicios/1/turnos/llamar-siguiente"
Invoke-RestMethod -Method Get -Uri "$env:SPEC04_BASE_URL/api/servicios/1/turno-actual"
```

**Resultado esperado**: la llamada responde `200` con el turno más antiguo en `En atención` y `fechaHoraLlamado`; la consulta actual devuelve ese turno. La fila de SPEC-03 deja de incluirlo y reduce su total.

Comprobar también:

1. Para otro servicio con turno elegible, generar dos llamados simultáneos al mismo endpoint. Solo una operación completa; la otra devuelve el conflicto de turno activo. La base conserva exactamente un registro `En atención` para el servicio, y el turno seleccionado no vuelve a llamarse.
2. Si el turno más antiguo del servicio está empatado en hora con otro, gana el correlativo numérico menor.
3. Si no hay turnos elegibles y no existe turno activo, la llamada devuelve el mensaje «No hay turnos en espera para este servicio» y los datos permanecen iguales.
4. Si ya hay un turno `En atención`, incluso generado en un día anterior, la llamada se rechaza con el mensaje de finalizar la atención actual y no se modifican turnos.
5. Un servicio registrado sin turno actual devuelve `200` y `turnoActual: null`; la interfaz muestra «Ninguno».
6. Un servicio inexistente devuelve `404` para ambas rutas.

## Aceptación manual de interfaz

1. Abrir la pantalla de llamado y seleccionar el servicio que tenga varios turnos en espera.
2. Pulsar «Llamar siguiente» y verificar que se muestra el más antiguo como turno actual; repetir lectura de fila SPEC-03 y comprobar que ya no se cuenta como «Esperando».
3. Consultar turno actual para un servicio sin activo; verificar «Ninguno».
4. Probar el rechazo de servicio sin seleccionar, fila vacía y servicio con turno activo; verificar mensajes claros y que los datos no cambian.
5. Reiniciar el host y consultar turno actual; comprobar que el estado y `FechaHoraLlamado` continúan persistidos.
6. Medir desde seleccionar servicio hasta leer el turno actual; registrar tiempo para CE-006.

Guardar `.trx`, capturas y notas de entorno en `specs/004-llamar-siguiente-turno/evidence/RF04-AT-XX/` y `evidence/CE-XXX/`. Usar solo datos ficticios y no incluir credenciales.
