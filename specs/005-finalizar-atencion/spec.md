# Especificación de funcionalidad: Finalizar atención (SPEC-05 / RF05)

**Rama de funcionalidad**: `docs/specs-01-06`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: SPEC-05: Permitir al recepcionista finalizar la atención del turno que se encuentra «En atención» en un servicio. Al finalizar, el turno pasa a «Atendido», registra fecha y hora de finalización y conserva su número, nombre del cliente si se indicó, y fechas y horas de generación, llamada y finalización. El servicio queda sin turno actual y puede llamarse al siguiente turno. Depende de SPEC-01, SPEC-02 y SPEC-04.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Finalizar el turno en atención (Prioridad: P1)

El recepcionista finaliza la atención del turno actual de un servicio para registrar que fue atendido y dejar el servicio disponible para continuar con el siguiente turno.

**Motivo de esta prioridad**: La finalización cierra correctamente la atención actual y permite que el servicio avance en la fila.

**Prueba independiente**: Con un turno «En atención» para un servicio, finalizarlo y verificar su estado final, fecha y hora de finalización, confirmación visible y ausencia de turno actual en ese servicio.

**Escenarios de aceptación**:

1. **Dado** un servicio con un turno «En atención», **Cuando** el recepcionista pulsa «Finalizar atención», **Entonces** el turno pasa a «Finalizado», registra la fecha y hora de finalización, se muestra un mensaje de confirmación y el turno actual del servicio muestra «Ninguno».
2. **Dado** que el turno de un servicio fue finalizado, **Cuando** el recepcionista pulsa «Llamar siguiente», **Entonces** el sistema permite llamar al siguiente turno en espera de ese servicio, sujeto a las reglas de SPEC-04.
3. **Dado** que hay turnos «En atención» en dos servicios distintos, **Cuando** el recepcionista finaliza el turno de uno de ellos, **Entonces** el turno del otro servicio y su estado no se modifican.

### Historia de usuario 2 - Conservar el registro de atención finalizada (Prioridad: P1)

El recepcionista necesita que cada turno finalizado mantenga los datos que permiten reconocerlo como registro de una atención realizada, incluso después de cerrar y volver a abrir la aplicación.

**Motivo de esta prioridad**: Conservar el número, los datos opcionales del cliente y los momentos de generación, llamada y finalización permite mantener la trazabilidad de la atención.

**Prueba independiente**: Finalizar un turno con nombre de cliente, cerrar y volver a abrir la aplicación, y verificar que el turno conserva su estado, número, nombre y todas sus fechas y horas.

**Escenarios de aceptación**:

1. **Dado** que un turno «En atención» tiene nombre de cliente, **Cuando** se finaliza y se revisan sus datos registrados, **Entonces** conserva el número, el nombre y las fechas y horas de generación, llamada y finalización.
2. **Dado** que un turno «En atención» no tiene nombre de cliente, **Cuando** se finaliza, **Entonces** puede quedar «Finalizado» sin que falte ese dato opcional ni se alteren sus demás datos.
3. **Dado** que se finalizó un turno y se cerró la aplicación, **Cuando** el recepcionista vuelve a abrirla, **Entonces** el turno conserva el estado «Finalizado» y su registro de atención.

### Historia de usuario 3 - Recibir indicaciones ante una finalización no válida (Prioridad: P1)

El recepcionista recibe una explicación cuando intenta finalizar sin seleccionar un servicio o cuando el servicio no tiene un turno en atención, sin cambios involuntarios en los turnos.

**Motivo de esta prioridad**: Una acción de cierre debe operar solo sobre la atención actual y comunicar claramente por qué no pudo realizarse.

**Prueba independiente**: Intentar finalizar sin servicio seleccionado y con un servicio que no tenga turno en atención; comprobar los mensajes correspondientes y que los datos permanecen sin cambios.

**Escenarios de aceptación**:

1. **Dado** que no se ha seleccionado un servicio, **Cuando** el recepcionista intenta finalizar una atención, **Entonces** el sistema le pide seleccionar un servicio y no modifica ningún dato.
2. **Dado** que el servicio seleccionado no tiene turnos «En atención», **Cuando** el recepcionista pulsa «Finalizar atención», **Entonces** el sistema informa claramente que no hay un turno en atención y no modifica ningún dato.
3. **Dado** un turno en estado «Finalizado», **Cuando** se intenta finalizarlo nuevamente o cambiarlo a otro estado, **Entonces** el sistema rechaza la operación y conserva sin cambios el turno y sus datos.

### Casos límite

- Si no existe un turno «En atención» para el servicio, no se selecciona otro turno ni se cambia la fila; se informa al recepcionista.
- Un turno «Finalizado» es terminal: las operaciones cubiertas por esta funcionalidad no pueden reabrirlo, volverlo a llamar ni cambiar su estado.
- Si dos servicios tienen turnos en atención, finalizar el de uno libera únicamente ese servicio.
- La finalización debe registrar su propia fecha y hora sin reemplazar ni alterar las fechas y horas de generación o llamada.
- El nombre del cliente es opcional; su ausencia no bloquea la finalización ni ocasiona que se invente o sobrescriba un nombre.
- Después de finalizar, el turno deja de ser el turno actual del servicio; no debe mostrarse como «En atención».
- Si no hay un siguiente turno esperando, finalizar igualmente completa el registro y deja el servicio disponible, sin generar un turno nuevo.

## Requisitos

### Requisitos funcionales

- **RF-001**: El sistema DEBE permitir al recepcionista seleccionar un servicio registrado para finalizar su turno actualmente «En atención».
- **RF-002**: Si no se selecciona un servicio, el sistema DEBE pedir que se seleccione uno y no debe modificar datos.
- **RF-003**: El sistema DEBE permitir finalizar únicamente el turno que esté en estado «En atención» para el servicio seleccionado.
- **RF-004**: Al finalizar correctamente un turno, el sistema DEBE cambiar su estado a «Finalizado» y registrar la fecha y hora de finalización.
- **RF-005**: El sistema DEBE confirmar la finalización con un mensaje comprensible.
- **RF-006**: Una vez finalizado el turno de un servicio, el turno actual de ese servicio DEBE mostrarse como «Ninguno» hasta que se llame a otro turno.
- **RF-007**: Al finalizar un turno, el sistema DEBE conservar su número, servicio, nombre del cliente si fue informado, estado final y fechas y horas de generación, llamada y finalización.
- **RF-008**: Si el servicio seleccionado no tiene un turno «En atención», el sistema DEBE informar que no hay ningún turno en atención y no debe modificar datos.
- **RF-009**: Un turno «Finalizado» DEBE ser inmutable respecto a su estado: el sistema NO DEBE permitir finalizarlo otra vez ni cambiarlo a otro estado.
- **RF-010**: La finalización DEBE afectar únicamente al turno del servicio seleccionado y no debe cambiar los turnos de otros servicios.
- **RF-011**: Al finalizar el turno actual, el servicio DEBE quedar disponible para llamar al siguiente turno en espera según las reglas de SPEC-04.
- **RF-012**: El sistema DEBE conservar el estado «Finalizado» y los datos de atención al cerrar y volver a abrir la aplicación.
- **RF-013**: Esta funcionalidad se limita a finalizar turnos. Cancelar, reabrir o editar turnos finalizados, generar reportes o estadísticas, ofrecer pantallas para el público y notificar a clientes quedan fuera de alcance.

### Entidades principales

- **Servicio de atención**: Servicio registrado según SPEC-01 al que pertenece el turno que se finalizará. Cada servicio mantiene su estado de atención actual de manera independiente.
- **Turno**: Registro generado según SPEC-02 y llamado según SPEC-04; contiene servicio, número, nombre opcional del cliente, estado y fechas y horas de generación, llamada y finalización.
- **Registro de atención finalizada**: Datos conservados del turno al pasar a «Finalizado», que identifican a quién se atendió y cuándo se generó, llamó y finalizó.

## Criterios de éxito

### Resultados medibles

- **CE-001**: En las pruebas de aceptación, el 100 % de los turnos válidos finalizados cambia a «Finalizado», registra fecha y hora de finalización y muestra confirmación.
- **CE-002**: En las pruebas de aceptación, después de finalizar el turno actual, el 100 % de los servicios afectados muestra «Ninguno» como turno actual hasta que se llame otro.
- **CE-003**: En las pruebas de aceptación, el 100 % de los intentos sin servicio seleccionado o sin turno en atención se rechaza con un mensaje claro y sin modificar datos.
- **CE-004**: En las pruebas de aceptación, ningún turno «Finalizado» vuelve a otro estado ni se altera al intentar finalizarlo otra vez.
- **CE-005**: Después de cerrar y volver a abrir la aplicación, el 100 % de los turnos finalizados conserva número, nombre si fue indicado, estado y fechas y horas de generación, llamada y finalización.
- **CE-006**: En una prueba de aceptación, el recepcionista puede finalizar una atención válida y reconocer que el servicio quedó libre en menos de 30 segundos.

## Supuestos

- SPEC-01 provee los servicios; SPEC-02 provee los turnos y su número, nombre opcional y fecha y hora de generación; SPEC-04 proporciona la llamada, el estado «En atención» y la fecha y hora de llamada.
- Existe como máximo un turno «En atención» por servicio conforme a SPEC-04; la acción de finalización se aplica a ese turno actual.
- La fecha y hora de finalización corresponden al momento en que se confirma el cambio a «Finalizado».
- El turno finalizado debe seguir conservado como registro, pero esta especificación no agrega una pantalla de búsqueda histórica, reportes ni estadísticas.
- La llamada del siguiente turno es una acción separada del recepcionista y sigue las reglas de SPEC-04; finalizar no llama automáticamente ni genera turnos.
- El recepcionista es el único usuario de la aplicación; los clientes no interactúan con el sistema.
