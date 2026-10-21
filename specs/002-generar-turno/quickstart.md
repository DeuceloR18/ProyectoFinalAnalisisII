# Guía rápida de validación: SPEC-02

La solución, los proyectos, SQL Server con Dapper y las convenciones de pruebas se reutilizan según [SPEC-01](../001-registrar-servicios/plan.md). Esta guía cubre únicamente la generación de turnos descrita en [plan.md](./plan.md), [data-model.md](./data-model.md) y [contracts/openapi.yaml](./contracts/openapi.yaml).

## Requisitos previos

- SDK .NET 10 y solución `ProyectoFinalAnalisisII.sln` con los proyectos compartidos de SPEC-01.
- Instancia SQL Server configurada con hora local de la operación; cadena de conexión local, sin secretos en el repositorio.
- Esquema de SPEC-01 aplicado y al menos un servicio registrado, excepto para verificar el caso de lista vacía.
- Script de base de datos de SPEC-02 aplicado: tablas de turnos y contadores, clave foránea, índice único y procedimiento de generación.
- Para pruebas de integración, configurar `SPEC02_SQLSERVER_CONNECTION` apuntando exclusivamente a una base de prueba aislada.

## Ejecutar pruebas

Desde la raíz de la solución, ejecutar las pruebas de todos los proyectos:

```powershell
dotnet test .\ProyectoFinalAnalisisII.sln --logger "trx;LogFileName=SPEC02-tests.trx"
```

**Resultado esperado**: xUnit verifica campos obligatorios/optativos, nombre de hasta 100 caracteres, estado «Esperando», formato mínimo de tres dígitos y extensión a `1000`; las pruebas de integración SQL Server verifican reinicio diario, unicidad, persistencia y generación simultánea. Las pruebas nunca deben apuntar a una base productiva.

## Validación de API

1. Iniciar Web según la guía de SPEC-01 y consultar `GET /api/servicios`.
2. Si la respuesta es `[]`, comprobar que la interfaz avisa que primero se debe registrar un servicio y no ofrece un alta válida.
3. Con un servicio de prefijo `C`, enviar `POST /api/servicios/{servicioId}/turnos` sin cuerpo; debe responder `201`, número `C-001`, estado `Esperando`, `nombreCliente: null` y fecha/hora local del servidor con desfase horario.
4. Repetir el POST para el mismo servicio y día; debe asignar `C-002`.
5. Repetir con otro servicio; su primer turno debe terminar en `001`, con su prefijo.
6. Preparar en la base de prueba el contador del servicio en `999` y comprobar que la siguiente respuesta contiene `C-1000`.
7. Enviar un nombre válido y comprobar que queda asociado; enviar un nombre compuesto solo por espacios y comprobar que el turno se crea sin nombre.
8. Enviar un nombre de 101 caracteres; debe responder `400` con mensaje por campo y el estado de almacenamiento no debe cambiar. Si se alcanza el máximo técnico de 38 dígitos, debe responder `409` sin insertar el turno.
9. Enviar solicitudes concurrentes al mismo servicio y comprobar que todos los números persistidos son únicos y secuenciales. Usar datos aislados y eliminar únicamente los registros creados por esta prueba.
10. Reiniciar el host y volver a crear turnos; verificar que el historial persiste y el contador continúa sin duplicar números.

## Aceptación manual de la interfaz

1. Abrir `/turnos/generar`, verificar que los servicios registrados aparecen para selección y que las etiquetas permiten completar el formulario con teclado.
2. Generar un turno sin nombre y otro con nombre; guardar capturas con número, estado y confirmación en `specs/002-generar-turno/evidence/RF02-AT-01/` y `RF02-AT-09/`.
3. Probar la ausencia de servicios y la falta de selección; capturar el mensaje claro y comprobar que no se crea ningún turno.
4. Intentar un nombre de 101 caracteres; capturar el mensaje de validación y comprobar que la información persistida no cambió.
5. Generar turnos para el mismo servicio y para otro servicio, revisar el orden y reiniciar la aplicación; comprobar la conservación en la base de prueba, sin agregar una pantalla de consulta histórica.
6. Para cambio de día y correlativo `999` a `1000`, usar la base de prueba; no alterar el reloj de un entorno compartido.

## Evidencia

Conservar una carpeta por criterio `RF02-AT-01` a `RF02-AT-12` y por criterio de éxito `CE-001` a `CE-005`, con el resultado de ejecución, captura cuando corresponda y una nota del entorno/fecha de prueba. Para la persistencia tras reinicio, registrar el resultado de la consulta de verificación en la base de prueba en lugar de añadir una pantalla histórica. Conservar también el `.trx` de concurrencia y el tiempo medido para CE-005. No incluir credenciales ni datos personales reales.
