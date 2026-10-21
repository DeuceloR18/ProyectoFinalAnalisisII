# Guía rápida de validación: SPEC-05

Esta guía valida la finalización sobre los servicios y turnos provistos por SPEC-01 a SPEC-04. La solución, proyectos, SQL Server/Dapper, host y herramientas de prueba no cambian.

## Requisitos previos

- SDK .NET 10 y solución `ProyectoFinalAnalisisII.sln`.
- SQL Server de prueba aislado con esquemas de SPEC-01 a SPEC-04 y el cambio SPEC-05 de `FechaHoraFinalizacion` aplicado.
- `SPEC02_SQLSERVER_CONNECTION` configurada hacia la base de integración aislada y `SPEC05_BASE_URL` hacia la aplicación de prueba.
- Datos ficticios: un servicio con turno en atención, idealmente uno con nombre y otro sin nombre, y un segundo servicio con activo para verificar aislamiento.
- La ruta de finalización y la de llamada SPEC-04 deben compartir el bloqueo de aplicación exclusivo por servicio.

## Ejecutar pruebas automatizadas

Desde la raíz del repositorio:

```powershell
dotnet test .\ProyectoFinalAnalisisII.sln --logger "trx;LogFileName=SPEC05-tests.trx"
```

**Resultado esperado**: Domain permite únicamente `En atención` → `Finalizado`; API y SQL Server persisten estado y marca temporal conservando los demás campos; el turno actual pasa a `null`; reiniciar el host no pierde el registro. La prueba simultánea obtiene una respuesta exitosa y una respuesta de conflicto para el mismo turno. Conservar `.trx` y notas en `specs/005-finalizar-atencion/evidence/`.

## Validación de API

Seleccionar un servicio de prueba que tenga exactamente un turno en atención:

```powershell
Invoke-RestMethod -Method Post -Uri "$env:SPEC05_BASE_URL/api/servicios/1/turnos/finalizar-atencion"
Invoke-RestMethod -Method Get -Uri "$env:SPEC05_BASE_URL/api/servicios/1/turno-actual"
```

**Resultado esperado**: el POST responde `200` con el turno en estado `Finalizado`, su número, nombre nullable y marcas de generación, llamado y finalización. El GET de SPEC-04 responde `turnoActual: null`; la interfaz muestra «Ninguno». Finalizar no genera ni llama otro turno.

Comprobar además:

1. Guardar una instantánea de todos los campos del turno antes de finalizar. Comparar después: solo cambian `Estado` y `FechaHoraFinalizacion`.
2. Enviar una finalización para un servicio existente sin turno activo. Debe responder `409`, código `sin_turno_en_atencion`, con mensaje comprensible; ninguna fila cambia.
3. Intentar finalizar de nuevo el turno ya finalizado. Debe recibirse el mismo conflicto de servicio sin activo; `FechaHoraFinalizacion` y los demás datos permanecen iguales.
4. Enviar dos finalizaciones al mismo tiempo para un servicio con un turno activo. Exactamente una responde `200`; la otra responde `409`; queda un único registro finalizado y ninguna fila en atención para ese servicio.
5. Finalizar en un servicio mientras otro servicio tiene turno en atención. Verificar que solo cambia el servicio objetivo.
6. Cerrar y volver a abrir el host y verificar en SQL Server que el registro finalizado conserva número, nombre (si se indicó), estado y todas las fechas.

## Aceptación manual de interfaz

1. Abrir la interfaz de turnos y elegir un servicio que tenga un turno en atención.
2. Seleccionar «Finalizar atención». Verificar el mensaje de confirmación y que el turno actual cambia a «Ninguno».
3. Repetir con un servicio sin turno en atención. Debe mostrarse el mensaje de rechazo y no cambiar ningún dato.
4. Intentar la operación sin seleccionar servicio. Debe pedirse una selección y no enviarse la petición de finalización.
5. Verificar que el servicio queda disponible para pulsar «Llamar siguiente» como operación separada; si hay un turno esperando, la llamada posterior debe seguir las reglas de SPEC-04.
6. Medir desde la selección del servicio hasta reconocer el mensaje y el estado «Ninguno»; registrar el tiempo para CE-006.

Guardar resultados automatizados, capturas y notas de entorno en `specs/005-finalizar-atencion/evidence/RF05-AT-XX/` y `evidence/CE-XXX/`. Usar solo datos ficticios y no incluir credenciales.

## Referencias

- [Contrato API](./contracts/openapi.yaml).
- [Modelo de datos](./data-model.md).
- [Investigación y decisiones](./research.md).
