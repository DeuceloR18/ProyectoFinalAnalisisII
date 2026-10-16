# Especificación de funcionalidad: Generar turno (SPEC-02 / RF02)

**Rama de funcionalidad**: `docs/specs-01-06`

**Creada**: 2026-10-14

**Estado**: Borrador

**Entrada**: SPEC-02: Generar un turno para un servicio existente, asignarle un número correlativo independiente por servicio y día, permitir el nombre opcional del cliente, mostrar el número al recepcionista y conservar los turnos generados al cerrar y volver a abrir la aplicación. Depende de SPEC-01.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Generar y entregar el número de turno (Prioridad: P1)

El recepcionista selecciona un servicio registrado, opcionalmente escribe el nombre del cliente y genera un turno. El sistema le muestra el número asignado para que pueda entregárselo al cliente.

**Motivo de esta prioridad**: La asignación y entrega del número es el objetivo esencial de la gestión de turnos.

**Prueba independiente**: Con al menos un servicio registrado, generar un turno y verificar que se muestra el número, el servicio asociado, el estado inicial «Esperando» y un mensaje de confirmación.

**Escenarios de aceptación**:

1. **Dado** que existe un servicio con prefijo «C», **Cuando** el recepcionista genera un turno para ese servicio, **Entonces** se crea con número «C-001», estado «Esperando» y fecha y hora de generación, se muestra el número asignado y se confirma la operación con un mensaje.
2. **Dado** que no se seleccionó un servicio, **Cuando** el recepcionista intenta generar un turno, **Entonces** la operación se rechaza con un mensaje claro y no se crea ningún turno.
3. **Dado** que no hay servicios registrados, **Cuando** el recepcionista intenta generar un turno, **Entonces** el sistema indica que primero debe registrar un servicio y no crea ningún turno.

### Historia de usuario 2 - Mantener la numeración por servicio y día (Prioridad: P1)

El recepcionista genera turnos para los servicios disponibles y recibe números secuenciales que permiten distinguirlos y respetar el orden de llegada, con un correlativo separado por servicio y reiniciado cada día.

**Motivo de esta prioridad**: Una numeración correcta evita confusiones entre servicios y asegura que los turnos reflejen el orden de llegada de cada jornada.

**Prueba independiente**: Generar varios turnos para el mismo servicio, generar turnos para otro servicio y repetir la prueba en una fecha posterior; verificar correlativos, prefijos y horas de generación.

**Escenarios de aceptación**:

1. **Dado** que el servicio «C» ya tiene el turno «C-001» generado hoy, **Cuando** el recepcionista genera otro turno para «C», **Entonces** recibe «C-002».
2. **Dado** que se generan turnos para dos servicios con prefijos distintos, **Cuando** se crea el primer turno de cada servicio en el día, **Entonces** cada servicio inicia su propia secuencia en «001» y utiliza su propio prefijo.
3. **Dado** que un servicio tuvo turnos el día anterior, **Cuando** el recepcionista genera su primer turno después del cambio de día, **Entonces** el correlativo vuelve a «001».
4. **Dado** que se generaron varios turnos, **Cuando** se comparan sus fechas y horas de generación, **Entonces** cada turno tiene registrada su fecha y hora para identificar su orden de llegada.

### Historia de usuario 3 - Asociar opcionalmente el nombre del cliente y conservar el turno (Prioridad: P1)

El recepcionista puede asociar el nombre del cliente al turno cuando lo conoce, o generar el turno sin ese dato; los turnos creados permanecen conservados si cierra y vuelve a abrir la aplicación.

**Motivo de esta prioridad**: La generación no debe depender de disponer del nombre del cliente, y la conservación evita perder los turnos ya emitidos.

**Prueba independiente**: Generar un turno con nombre y otro sin nombre, cerrar y volver a abrir la aplicación, y verificar que ambos turnos se conservan con sus datos, número y estado.

**Escenarios de aceptación**:

1. **Dado** que el recepcionista escribe el nombre de un cliente, **Cuando** genera el turno, **Entonces** el nombre queda asociado al turno generado.
2. **Dado** que el nombre del cliente se deja vacío, **Cuando** el recepcionista genera el turno para un servicio válido, **Entonces** el turno se genera igualmente y el nombre queda sin informar.
3. **Dado** que se generaron turnos y se cerró la aplicación, **Cuando** el recepcionista vuelve a abrirla, **Entonces** los turnos continúan conservados con su número, servicio, estado, fecha y hora y, cuando se informó, el nombre del cliente.

### Casos límite

- Si la lista de servicios está vacía, el sistema debe explicar que primero hay que registrar un servicio; no debe permitir crear un turno sin servicio.
- Si la selección del servicio no corresponde a un servicio registrado, la generación debe rechazarse sin guardar un turno.
- Un nombre de cliente vacío o compuesto solo por espacios se considera no informado; no impide la generación del turno.
- La secuencia diaria debe distinguir tanto el servicio como la fecha: un nuevo día reinicia cada servicio por separado, sin alterar ni eliminar turnos previos.
- Si el correlativo alcanza 999 en el mismo día para un servicio, el siguiente número debe seguir siendo único y secuencial; se asume que el formato usa al menos tres dígitos y puede ampliarse a cuatro o más.
- La fecha usada para determinar el día de reinicio corresponde al día calendario local de la aplicación en el momento de generación.
- La persistencia tras reabrir debe conservar los turnos previos y evitar que el siguiente turno del mismo servicio y día repita un número.

## Requisitos

### Requisitos funcionales

- **RF-001**: El sistema DEBE permitir al recepcionista seleccionar un servicio previamente registrado y generar para él un turno.
- **RF-002**: El sistema DEBE rechazar la generación si no se seleccionó un servicio o si el servicio no existe, mostrar un mensaje claro y no guardar ningún turno.
- **RF-003**: Si no hay servicios registrados, el sistema DEBE informar al recepcionista que primero debe registrar un servicio y no debe crear un turno.
- **RF-004**: El sistema DEBE formar el número del turno con el prefijo del servicio y un correlativo numérico separado por un guion, por ejemplo, «C-001»; el correlativo se muestra con al menos tres dígitos.
- **RF-005**: El sistema DEBE mantener una secuencia correlativa independiente para cada servicio y fecha; el primer turno del día para cada servicio recibe el correlativo «001», y cada turno posterior incrementa en uno.
- **RF-006**: El sistema DEBE determinar el día de la secuencia usando el día calendario local en que se genera el turno. Los turnos de días anteriores se conservan y no afectan el correlativo del día nuevo.
- **RF-007**: Cada turno nuevo DEBE quedar en estado «Esperando» y registrar la fecha y hora de generación.
- **RF-008**: El sistema DEBE permitir que el recepcionista indique opcionalmente el nombre del cliente y asociarlo al turno cuando se proporciona. La omisión del nombre no debe impedir la generación.
- **RF-009**: Tras generar un turno correctamente, el sistema DEBE mostrar al recepcionista el número asignado y confirmar la operación con un mensaje.
- **RF-010**: El sistema DEBE conservar los turnos y sus datos al cerrar y volver a abrir la aplicación, de modo que la numeración pueda continuar sin repetir números dentro del mismo servicio y día.
- **RF-011**: Esta funcionalidad se limita a generar turnos. Llamar, finalizar o cancelar turnos, imprimir tickets, ofrecer pantallas para el público y enviar notificaciones a clientes quedan fuera de alcance.

### Entidades principales

- **Servicio de atención**: Servicio registrado según SPEC-01, identificado por su nombre y prefijo único en mayúsculas. Cada turno pertenece a un servicio existente.
- **Turno**: Registro de una solicitud de atención, asociado a un servicio; contiene el número formado por prefijo y correlativo diario, el estado, la fecha y hora de generación y, opcionalmente, el nombre del cliente.
- **Correlativo diario por servicio**: Posición numérica del turno dentro de la secuencia de un servicio en una fecha determinada. La secuencia es independiente para cada servicio y se reinicia al comenzar un nuevo día local.

## Criterios de éxito

### Resultados medibles

- **CE-001**: En las pruebas de aceptación, el 100 % de los turnos generados para servicios existentes muestra un número con el prefijo correcto, estado «Esperando» y confirmación visible.
- **CE-002**: En las pruebas de aceptación, el 100 % de las secuencias aumenta en uno para el mismo servicio y día, comienza en «001» para cada servicio y vuelve a «001» al cambiar el día.
- **CE-003**: En las pruebas de aceptación, el 100 % de los intentos sin un servicio válido se rechaza con un mensaje comprensible y sin crear turnos.
- **CE-004**: El 100 % de los turnos generados se conserva al cerrar y volver a abrir la aplicación, incluyendo número, servicio, estado y fecha y hora; el nombre se conserva cuando fue informado.
- **CE-005**: En una prueba de aceptación, el recepcionista puede generar un turno válido y leer el número asignado en menos de 30 segundos.

## Supuestos

- SPEC-01 está disponible y provee los servicios registrados con prefijos únicos normalizados en mayúsculas; esta funcionalidad no registra ni modifica servicios.
- El nombre del cliente es opcional; si está vacío o solo contiene espacios, se conserva como no informado. Si se proporciona, se conserva sin exigir un formato adicional.
- El día de reinicio de la secuencia es el día calendario local de la aplicación; la hora de generación corresponde al momento en que se confirma la creación del turno.
- El correlativo usa tres dígitos como ancho mínimo, con ceros a la izquierda; si supera 999, continúa con todos los dígitos necesarios para mantener la secuencia única.
- El recepcionista es el único usuario del sistema; los clientes no interactúan con la aplicación.
- Esta especificación no agrega consulta histórica de turnos ni operaciones posteriores sobre ellos; solo requiere que se conserven sus datos.
