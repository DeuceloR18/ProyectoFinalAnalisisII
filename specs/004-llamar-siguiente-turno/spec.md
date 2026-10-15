# Especificación de funcionalidad: Llamar siguiente turno (SPEC-04 / RF04)

**Rama de funcionalidad**: `docs/specs-01-06`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: SPEC-04: Permitir al recepcionista llamar al turno «Esperando» más antiguo del servicio seleccionado, cambiarlo a «En atención» y registrar la fecha y hora de llamada. Mostrar el turno actualmente en atención por servicio y conservar el cambio al cerrar y volver a abrir la aplicación. Depende de SPEC-01, SPEC-02 y SPEC-03.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Llamar al siguiente turno (Prioridad: P1)

El recepcionista solicita llamar al siguiente turno de un servicio. El sistema selecciona automáticamente el turno en espera más antiguo del día, lo pasa a atención y muestra su número como turno actual.

**Motivo de esta prioridad**: Llamar al siguiente turno permite comenzar la atención respetando el orden de llegada.

**Prueba independiente**: Para un servicio con varios turnos elegibles y ninguno en atención, solicitar la llamada y verificar que se selecciona el más antiguo, cambia su estado, queda registrada la fecha y hora de llamada y aparece como turno actual.

**Escenarios de aceptación**:

1. **Dado** un servicio con turnos de hoy en estado «Esperando» y ninguno en estado «En atención», **Cuando** el recepcionista pulsa «Llamar siguiente», **Entonces** se selecciona el turno más antiguo, pasa a «En atención», se registra la fecha y hora de llamada y se muestra como turno actual.
2. **Dado** que «C-001» y «C-002» están en espera para el mismo servicio y día, en ese orden, **Cuando** el recepcionista llama al siguiente, **Entonces** «C-001» pasa a «En atención» y «C-002» queda como el primero de la fila de espera.
3. **Dado** que hay turnos esperando en dos servicios distintos, **Cuando** el recepcionista llama al siguiente de uno de ellos, **Entonces** solo cambia el turno de ese servicio y el otro servicio permanece sin cambios.
4. **Dado** que se llamó correctamente un turno, **Cuando** se consulta la fila de espera del servicio, **Entonces** el turno llamado ya no aparece y el total de turnos en espera disminuye en uno.

### Historia de usuario 2 - Consultar el turno actual de un servicio (Prioridad: P1)

El recepcionista consulta qué turno está siendo atendido en cada servicio para conocer el estado de atención actual.

**Motivo de esta prioridad**: Identificar claramente el turno en atención evita confusiones y permite comprobar el resultado de la llamada.

**Prueba independiente**: Consultar el turno actual de un servicio con un turno en atención y de otro sin turno en atención, y verificar que cada servicio muestra su número actual o «Ninguno».

**Escenarios de aceptación**:

1. **Dado** que el servicio tiene un turno en estado «En atención», **Cuando** el recepcionista consulta cuál es el turno actual, **Entonces** se muestra el número de ese turno, por ejemplo «C-003».
2. **Dado** que el servicio no tiene ningún turno en estado «En atención», **Cuando** el recepcionista consulta cuál es el turno actual, **Entonces** se muestra «Ninguno».
3. **Dado** que un turno está en atención y se cerró la aplicación, **Cuando** el recepcionista vuelve a abrirla y consulta el turno actual, **Entonces** se muestra el mismo número y el turno conserva el estado «En atención».

### Historia de usuario 3 - Recibir información ante llamadas no permitidas (Prioridad: P1)

El recepcionista recibe una indicación clara cuando no puede llamar: no hay un servicio seleccionado, no hay turnos en espera o ya existe un turno en atención para el servicio.

**Motivo de esta prioridad**: Los mensajes claros explican por qué la acción no se realizó y previenen cambios de estado inesperados.

**Prueba independiente**: Intentar llamar sin servicio seleccionado, con una fila vacía y con un turno ya en atención; verificar el mensaje correspondiente y que ningún turno se modifica.

**Escenarios de aceptación**:

1. **Dado** que no se ha seleccionado un servicio, **Cuando** el recepcionista intenta llamar al siguiente turno, **Entonces** el sistema le pide seleccionar un servicio y no modifica datos.
2. **Dado** que no hay turnos en espera para el servicio seleccionado, **Cuando** el recepcionista pulsa «Llamar siguiente», **Entonces** el sistema muestra «No hay turnos en espera para este servicio» y no cambia ningún dato.
3. **Dado** que el servicio ya tiene un turno en estado «En atención», **Cuando** el recepcionista pulsa «Llamar siguiente», **Entonces** el sistema informa que debe finalizarse la atención actual antes de llamar a otro turno y no modifica ningún turno.

### Casos límite

- Solo se consideran candidatos los turnos del servicio seleccionado, en estado «Esperando» y generados durante el día actual local.
- Un turno en atención de ese servicio impide llamar a otro, incluso si el turno activo se generó en un día anterior; la regla de un turno activo por servicio prevalece sobre el reinicio diario de la fila.
- Si coinciden la fecha y hora de generación de dos turnos candidatos del mismo servicio, se desempata por número secuencial ascendente, de acuerdo con SPEC-02.
- Si se rechaza una llamada, no deben cambiar el estado, la fecha y hora de llamada ni los datos de ningún turno.
- Llamar nuevamente cuando un turno sigue en atención nunca debe reemplazar el turno actual ni crear una segunda atención activa.
- La persistencia de un turno en atención significa que, tras reabrir la aplicación, ese turno continúa bloqueando una nueva llamada para el mismo servicio hasta que otra funcionalidad autorizada lo saque de ese estado.

## Requisitos

### Requisitos funcionales

- **RF-001**: El sistema DEBE permitir al recepcionista seleccionar un servicio registrado para llamar al siguiente turno.
- **RF-002**: Si no se selecciona un servicio, el sistema DEBE pedir que se seleccione uno y no debe modificar ningún dato.
- **RF-003**: El sistema DEBE seleccionar automáticamente el turno más antiguo que pertenezca al servicio seleccionado, esté en estado «Esperando» y haya sido generado durante el día actual local. El recepcionista no puede elegir un turno distinto ni saltarse el orden.
- **RF-004**: Si dos candidatos tienen la misma fecha y hora de generación, el sistema DEBE priorizar el número secuencial menor.
- **RF-005**: Al llamar correctamente al turno seleccionado, el sistema DEBE cambiar su estado a «En atención» y registrar la fecha y hora de llamada.
- **RF-006**: El sistema DEBE permitir como máximo un turno en estado «En atención» por servicio. Si ya existe un turno activo para el servicio, aunque se haya generado en un día anterior, DEBE rechazar la llamada de otro turno, informar que se debe finalizar la atención actual y dejar todos los datos sin cambios.
- **RF-007**: Si no hay turnos en espera elegibles para el servicio y no existe un turno en atención que active el bloqueo indicado en RF-006, el sistema DEBE mostrar el mensaje «No hay turnos en espera para este servicio» y no cambiar ningún dato.
- **RF-008**: El sistema DEBE mostrar para cada servicio el número de su turno actualmente en estado «En atención»; si no existe, DEBE mostrar «Ninguno».
- **RF-009**: Tras una llamada exitosa, el turno llamado DEBE dejar de formar parte de la fila de espera de SPEC-03 y el total de turnos en espera debe disminuir en uno.
- **RF-010**: La llamada de un turno DEBE afectar únicamente al servicio seleccionado; los turnos de otros servicios deben permanecer sin cambios.
- **RF-011**: El sistema DEBE conservar el estado «En atención» y la fecha y hora de llamada al cerrar y volver a abrir la aplicación.
- **RF-012**: Esta funcionalidad se limita a llamar al siguiente turno y mostrar el turno actual. Finalizar o cancelar turnos, saltarse el orden, emitir anuncios por voz o altavoz, ofrecer pantallas para el público y notificar a clientes quedan fuera de alcance.

### Entidades principales

- **Servicio de atención**: Servicio registrado según SPEC-01; sus turnos se llaman y muestran de manera independiente.
- **Turno**: Registro generado según SPEC-02, asociado a un servicio, con número, estado y fecha y hora de generación; al ser llamado registra además la fecha y hora de llamada.
- **Turno actual del servicio**: Turno del servicio que permanece en estado «En atención»; cada servicio puede tener como máximo uno. Si no hay turno en ese estado, el servicio no tiene turno actual.

## Criterios de éxito

### Resultados medibles

- **CE-001**: En las pruebas de aceptación, el 100 % de las llamadas válidas selecciona el turno elegible más antiguo del servicio y día y lo cambia a «En atención» con fecha y hora de llamada.
- **CE-002**: En las pruebas de aceptación, ningún servicio llega a tener más de un turno en estado «En atención»; todo intento de llamada mientras haya uno activo se rechaza sin alterar datos.
- **CE-003**: En las pruebas de aceptación, el turno actual mostrado coincide en el 100 % de los casos con el único turno en atención del servicio, o muestra «Ninguno» si no existe.
- **CE-004**: En las pruebas de aceptación, las llamadas rechazadas por falta de selección, ausencia de turnos en espera o turno ya activo muestran el mensaje correspondiente y no modifican datos.
- **CE-005**: Después de cerrar y volver a abrir la aplicación, el 100 % de los turnos llamados conserva su estado «En atención» y su fecha y hora de llamada.
- **CE-006**: En una prueba de aceptación, el recepcionista puede llamar al siguiente turno de un servicio y leer el turno actual en menos de 30 segundos.

## Supuestos

- SPEC-01 proporciona los servicios existentes, SPEC-02 los turnos con su número, estado y fechas, y SPEC-03 la fila de espera que debe reflejar los cambios de estado.
- «Día actual» se determina usando la fecha calendario local de la aplicación, de acuerdo con SPEC-02 y SPEC-03.
- La fecha y hora de llamada corresponden al momento en que se confirma el cambio a «En atención».
- La regla de máximo un turno activo por servicio aplica sin importar el día de generación del turno; un turno activo del día anterior sigue impidiendo llamar otro.
- La finalización del turno activo corresponde a otra funcionalidad, fuera del alcance de SPEC-04. Hasta que una funcionalidad autorizada cambie el turno de «En atención» a otro estado, no se podrá llamar el siguiente para ese servicio.
- «Mostrar en pantalla el turno actual» significa presentar el número asociado al servicio en la interfaz que utiliza el recepcionista; no implica una pantalla pública.
- El recepcionista es el único usuario de la aplicación; los clientes reciben el número, pero no interactúan con el sistema.
