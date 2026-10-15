# Especificación de funcionalidad: Consultar fila de espera (SPEC-03 / RF03)

**Rama de funcionalidad**: `docs/specs-01-06`

**Creada**: 2026-10-14

**Estado**: Borrador

**Entrada**: SPEC-03: Permitir al recepcionista consultar la fila de espera de un servicio. La fila incluye únicamente los turnos de ese servicio en estado «Esperando» generados durante el día actual, ordenados desde el más antiguo según su fecha y hora de generación. Cada elemento muestra posición, número de turno y nombre del cliente si fue indicado; también se muestra el total en espera. La consulta no modifica datos. Depende de SPEC-01 y SPEC-02.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Consultar la fila de un servicio (Prioridad: P1)

El recepcionista selecciona un servicio y consulta quiénes están esperando, en qué orden y cuántos turnos hay pendientes, para saber quién sigue en la fila.

**Motivo de esta prioridad**: Conocer el orden actual y el total de personas en espera es la finalidad principal de esta consulta.

**Prueba independiente**: Preparar turnos del día para un servicio en estado «Esperando», consultar ese servicio y verificar que la lista muestra posiciones consecutivas, números en orden de llegada y el total correcto.

**Escenarios de aceptación**:

1. **Dado** un servicio con turnos del día en estado «Esperando», **Cuando** el recepcionista consulta su fila, **Entonces** ve los turnos ordenados del más antiguo al más reciente, con posición y número de turno, y el total de turnos en espera.
2. **Dado** que «C-001» se generó antes que «C-002» para el mismo servicio y día, **Cuando** el recepcionista consulta la fila, **Entonces** «C-001» aparece en la posición 1 y «C-002» en la posición 2.
3. **Dado** un turno en espera con nombre de cliente y otro sin nombre, **Cuando** el recepcionista consulta la fila, **Entonces** el nombre indicado aparece junto al número correspondiente y el turno sin nombre muestra solo su número.
4. **Dado** que se generó un nuevo turno en espera para el servicio durante el día, **Cuando** el recepcionista vuelve a consultar la fila, **Entonces** el nuevo turno aparece al final de la fila y el total aumenta en uno.

### Historia de usuario 2 - Consultar solo turnos actualmente en espera (Prioridad: P1)

El recepcionista necesita que la fila refleje únicamente a quienes siguen esperando por el servicio elegido y durante el día actual, excluyendo turnos que ya no estén esperando o que pertenezcan a otro día o servicio.

**Motivo de esta prioridad**: Una fila limitada al servicio, fecha y estado correctos evita presentar un orden desactualizado o confundir turnos de distintos servicios.

**Prueba independiente**: Preparar turnos del servicio seleccionado y de otro servicio, con fechas y estados variados; consultar la fila y verificar que solo se incluyan los turnos elegibles.

**Escenarios de aceptación**:

1. **Dado** que hay turnos del servicio seleccionado con estado «En atención», «Finalizado» o «Cancelado», **Cuando** el recepcionista consulta su fila, **Entonces** esos turnos no aparecen y el total refleja únicamente los turnos que siguen «Esperando».
2. **Dado** que hay turnos en espera de dos servicios distintos, **Cuando** el recepcionista consulta la fila de uno de ellos, **Entonces** solo aparecen turnos del servicio seleccionado.
3. **Dado** que hay turnos en espera de días anteriores y del día actual, **Cuando** el recepcionista consulta la fila, **Entonces** solo aparecen los generados durante el día actual.
4. **Dado** que el servicio seleccionado no tiene turnos elegibles, **Cuando** el recepcionista consulta su fila, **Entonces** el total mostrado es 0 y aparece un mensaje claro que indica que no hay personas en espera.

### Historia de usuario 3 - Consultar sin alterar la información (Prioridad: P1)

El recepcionista consulta la fila sin cambiar los turnos ni su orden de llegada; si no selecciona un servicio, recibe indicaciones para hacerlo.

**Motivo de esta prioridad**: La fila es una vista informativa; consultarla no debe cambiar el estado ni otros datos de los turnos.

**Prueba independiente**: Comparar los datos de los turnos antes y después de consultar; repetir la consulta sin seleccionar servicio y verificar que se solicita una selección sin mostrar información de turnos.

**Escenarios de aceptación**:

1. **Dado** que el recepcionista no ha seleccionado un servicio, **Cuando** intenta consultar la fila, **Entonces** el sistema le pide seleccionar un servicio y no muestra datos de turnos.
2. **Dado** un conjunto de turnos registrados, **Cuando** el recepcionista consulta su fila, **Entonces** la consulta no modifica el estado, la fecha y hora de generación, el servicio, el número ni el nombre de ningún turno.

### Casos límite

- La fila vacía muestra cantidad 0 y un mensaje de estado vacío, sin presentarse como un error.
- Los turnos de otro servicio, de un día anterior o con un estado distinto de «Esperando» no cuentan en el total ni ocupan una posición.
- Si la fecha y hora de generación de dos turnos coinciden, se conserva un orden determinista; se usa el número secuencial del turno como desempate para el mismo servicio y día.
- Si el servicio no está seleccionado, no se presenta una fila previa como si correspondiera a una selección actual.
- Una consulta repetida no duplica filas ni altera la posición de los turnos existentes.

## Requisitos

### Requisitos funcionales

- **RF-001**: El sistema DEBE permitir al recepcionista seleccionar un servicio registrado para consultar su fila de espera.
- **RF-002**: Si no se selecciona un servicio, el sistema DEBE solicitar que se seleccione uno y no debe mostrar datos de turnos.
- **RF-003**: La fila DEBE incluir únicamente turnos del servicio seleccionado que tengan estado «Esperando» y cuya fecha de generación corresponda al día actual local.
- **RF-004**: El sistema DEBE ordenar la fila desde la fecha y hora de generación más antigua hasta la más reciente. Si dos turnos tienen la misma fecha y hora, DEBE ordenarlos por su número secuencial ascendente.
- **RF-005**: Cada elemento de la fila DEBE mostrar su posición consecutiva comenzando en 1 y el número de turno.
- **RF-006**: Cada elemento DEBE mostrar el nombre del cliente cuando haya sido informado; si no se informó, DEBE mostrar el número sin un nombre.
- **RF-007**: El sistema DEBE mostrar la cantidad total de turnos que cumplen las condiciones de inclusión de la fila.
- **RF-008**: Los turnos en estado «En atención», «Finalizado» o «Cancelado», y los turnos que no sean del servicio seleccionado o del día actual, NO DEBEN aparecer ni contarse.
- **RF-009**: Si no hay turnos que cumplan las condiciones de inclusión, el sistema DEBE mostrar el total 0 y un mensaje claro de que no hay personas en espera.
- **RF-010**: La consulta DEBE ser de solo lectura: no debe modificar turnos, estados, orden asignado, ni otros datos registrados.
- **RF-011**: Cuando el recepcionista consulta de nuevo la fila después de generarse un turno elegible, el sistema DEBE incluirlo en la posición que le corresponda y actualizar el total.
- **RF-012**: Esta funcionalidad se limita a consultar la fila; llamar, finalizar o cancelar turnos, cambiar manualmente su orden, ofrecer pantallas para el público y enviar notificaciones quedan fuera de alcance.

### Entidades principales

- **Servicio de atención**: Servicio registrado según SPEC-01, elegido por el recepcionista para limitar la consulta de la fila.
- **Turno**: Registro generado según SPEC-02, con servicio, número, estado, fecha y hora de generación y nombre de cliente opcional; sus datos se consultan sin modificarlos.
- **Fila de espera**: Vista calculada para un servicio y día, formada por los turnos de ese servicio en estado «Esperando», ordenados por llegada y numerados con posiciones consecutivas; incluye el total de turnos en espera.

## Criterios de éxito

### Resultados medibles

- **CE-001**: En las pruebas de aceptación, el 100 % de los turnos elegibles de un servicio y día aparece exactamente una vez y en orden ascendente de fecha y hora de generación.
- **CE-002**: En las pruebas de aceptación, el total mostrado coincide en el 100 % de los casos con la cantidad de turnos elegibles, incluidas las filas vacías con total 0.
- **CE-003**: En las pruebas de aceptación, el 100 % de los turnos que no cumplen el servicio, el día o el estado requerido queda excluido tanto de la lista como del total.
- **CE-004**: En las pruebas de aceptación, el 100 % de las consultas deja sin cambios los datos de los turnos.
- **CE-005**: En una prueba de aceptación, el recepcionista puede seleccionar un servicio, consultar su fila e identificar quién sigue en menos de 30 segundos.

## Supuestos

- La dependencia de SPEC-01 provee los servicios registrados, y SPEC-02 provee los turnos con servicio, número, estado, fecha y hora de generación y nombre de cliente opcional.
- «Día actual» se determina con la fecha calendario local de la aplicación, en consistencia con la generación diaria de turnos definida en SPEC-02.
- Cada turno en estado «Esperando» representa a una persona para efectos del total; el conteo corresponde a turnos, no a nombres de cliente informados.
- Los cambios de estado realizados por otras funcionalidades se reflejan en la siguiente consulta; esta especificación no implementa transiciones de estado.
- Si dos turnos del mismo servicio y día tienen la misma fecha y hora de generación, su número secuencial ascendente define el desempate.
- Al consultar de nuevo se obtiene la composición actual de la fila; no se requiere actualización automática en tiempo real.
