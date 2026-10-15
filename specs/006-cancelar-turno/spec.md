# Especificación de funcionalidad: Cancelar turno (SPEC-06 / RF06)

**Rama de funcionalidad**: `docs/specs-01-06`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: SPEC-06: Permitir al recepcionista, como requerimiento de prioridad secundaria, cancelar un turno que esté en espera después de confirmar la acción. Al confirmar, el turno pasa a «Cancelado», registra la fecha y hora de cancelación, conserva su número y registro, deja de aparecer en la fila de espera y su número no se reutiliza. Depende de SPEC-02 y SPEC-03.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Cancelar un turno en espera con confirmación (Prioridad: P2)

El recepcionista cancela un turno en espera cuando la persona ya no desea recibir atención. Antes de efectuar el cambio, el sistema muestra una confirmación que identifica el número del turno.

**Motivo de esta prioridad**: La cancelación es una capacidad secundaria que permite mantener actualizada la fila cuando una persona ya no espera atención.

**Prueba independiente**: Solicitar la cancelación de un turno «Esperando», confirmar la acción y verificar que pasa a «Cancelado», registra fecha y hora de cancelación, se informa el resultado y deja de aparecer en la fila.

**Escenarios de aceptación**:

1. **Dado** un turno en estado «Esperando», **Cuando** el recepcionista solicita cancelarlo y confirma la acción identificada por el número del turno, **Entonces** el turno pasa a «Cancelado», se registra la fecha y hora de cancelación y se muestra un mensaje de confirmación.
2. **Dado** un turno en estado «Esperando», **Cuando** el recepcionista solicita cancelarlo y no confirma, **Entonces** el turno permanece «Esperando» y no se modifica ningún dato.
3. **Dado** que se canceló un turno, **Cuando** se consulta la fila de espera, **Entonces** el turno no aparece y el total disminuye en uno.
4. **Dado** que «C-001», «C-002» y «C-003» están en espera, **Cuando** el recepcionista cancela «C-002» y confirma, **Entonces** la fila muestra «C-001» en la posición 1 y «C-003» en la posición 2, manteniendo el orden relativo de los turnos no cancelados.

### Historia de usuario 2 - Conservar el registro y el número del turno cancelado (Prioridad: P2)

El recepcionista necesita que un turno cancelado permanezca como registro y que su número no se asigne de nuevo a futuros turnos.

**Motivo de esta prioridad**: Conservar la identidad del turno evita duplicidades y mantiene la trazabilidad de los números emitidos.

**Prueba independiente**: Cancelar un turno, cerrar y volver a abrir la aplicación, revisar su registro y generar otro turno del mismo servicio y día; comprobar que el turno continúa cancelado y que su número no se reutiliza.

**Escenarios de aceptación**:

1. **Dado** que se canceló el turno «C-002», **Cuando** se genera otro turno para el mismo servicio, **Entonces** recibe el siguiente número disponible y no reutiliza «C-002».
2. **Dado** que se canceló un turno y se cerró la aplicación, **Cuando** el recepcionista vuelve a abrirla, **Entonces** el turno conserva el estado «Cancelado», su número y su registro.

### Historia de usuario 3 - Rechazar cancelaciones no permitidas (Prioridad: P2)

El recepcionista recibe una explicación cuando intenta cancelar un turno que no está en espera o cuya cancelación ya se efectuó.

**Motivo de esta prioridad**: Evitar cambios inválidos protege la atención en curso y el historial de los turnos terminados.

**Prueba independiente**: Intentar cancelar turnos «En atención», «Finalizado» y «Cancelado»; verificar que cada intento se rechaza con un mensaje claro y que ningún dato cambia.

**Escenarios de aceptación**:

1. **Dado** un turno «En atención» o «Finalizado», **Cuando** el recepcionista intenta cancelarlo, **Entonces** el sistema rechaza la acción con un mensaje claro y no modifica el turno.
2. **Dado** un turno ya «Cancelado», **Cuando** el recepcionista intenta cancelarlo nuevamente, **Entonces** el sistema no permite la operación y no modifica el turno.
3. **Dado** un turno que estaba «Esperando» al mostrar la confirmación, pero cuyo estado dejó de ser «Esperando» antes de confirmar, **Cuando** el recepcionista confirma, **Entonces** el sistema rechaza la cancelación y conserva los datos actuales del turno.

### Casos límite

- La confirmación debe identificar claramente el número del turno para evitar cancelar uno distinto por error.
- Si el recepcionista cancela o cierra la confirmación, el turno y todos sus datos permanecen sin cambios.
- Solo los turnos «Esperando» son cancelables; los estados «En atención», «Finalizado» y «Cancelado» se rechazan.
- Si el estado del turno cambia mientras la confirmación está abierta, la confirmación no autoriza cancelar el nuevo estado; el sistema vuelve a validar que siga «Esperando».
- Al excluir un turno cancelado de la fila, las posiciones de los demás turnos se vuelven consecutivas de acuerdo con el orden que ya tenían; no se cambia el orden relativo.
- Los números emitidos, incluidos los de turnos cancelados, no vuelven a estar disponibles. La numeración posterior continúa con el siguiente correlativo según SPEC-02.
- La cancelación de un turno de un servicio no cambia turnos de otros servicios.
- El estado «Cancelado» y la fecha y hora de cancelación deben conservarse después de cerrar y volver a abrir la aplicación.

## Requisitos

### Requisitos funcionales

- **RF-001**: El sistema DEBE permitir al recepcionista solicitar la cancelación de un turno en estado «Esperando».
- **RF-002**: Antes de modificar el turno, el sistema DEBE pedir confirmación e identificar el turno por su número.
- **RF-003**: Si el recepcionista no confirma, el sistema NO DEBE cambiar el estado ni ningún otro dato del turno.
- **RF-004**: Al confirmar, el sistema DEBE comprobar que el turno continúa en estado «Esperando»; si ya no lo está, DEBE rechazar la operación y conservar los datos actuales.
- **RF-005**: Al cancelar correctamente, el sistema DEBE cambiar el estado a «Cancelado» y registrar la fecha y hora de cancelación.
- **RF-006**: El turno cancelado DEBE conservar su número, servicio, registro y datos previos. La cancelación no debe sobrescribir fechas y horas de generación o llamada.
- **RF-007**: Un turno en estado «En atención», «Finalizado» o «Cancelado» NO DEBE poder cancelarse; el sistema DEBE informar el motivo y no modificarlo.
- **RF-008**: Un turno cancelado DEBE dejar de aparecer en la fila de espera definida por SPEC-03 y dejar de contarse como persona en espera.
- **RF-009**: Al excluir un turno cancelado de la fila, el sistema DEBE mantener el orden relativo de los turnos restantes y mostrar sus posiciones consecutivas actualizadas.
- **RF-010**: El número de un turno cancelado NO DEBE reutilizarse en turnos posteriores; la generación debe continuar según el siguiente correlativo definido por SPEC-02.
- **RF-011**: La cancelación DEBE afectar únicamente al turno seleccionado y no debe modificar turnos de otros servicios.
- **RF-012**: El sistema DEBE conservar el estado «Cancelado», el número y la fecha y hora de cancelación al cerrar y volver a abrir la aplicación.
- **RF-013**: Esta funcionalidad se limita a cancelar de manera individual turnos en espera con confirmación. Cancelar turnos «En atención», reactivar turnos cancelados, realizar cancelaciones masivas, notificar al cliente y ofrecer pantallas para el público quedan fuera de alcance.

### Entidades principales

- **Turno**: Registro creado según SPEC-02, identificado por un número único y asociado a un servicio; contiene estado y fechas relevantes. Al cancelarse conserva su registro y agrega la fecha y hora de cancelación.
- **Confirmación de cancelación**: Solicitud mostrada al recepcionista antes de cambiar el estado, identificada por el número del turno; la cancelación solo se aplica si el turno sigue en espera y el recepcionista confirma.
- **Fila de espera**: Vista definida por SPEC-03 que excluye turnos cancelados, conserva el orden relativo de los restantes y actualiza su total y posiciones.

## Criterios de éxito

### Resultados medibles

- **CE-001**: En las pruebas de aceptación, el 100 % de las cancelaciones confirmadas de turnos «Esperando» cambia a «Cancelado» y conserva la fecha y hora de cancelación.
- **CE-002**: En las pruebas de aceptación, el 100 % de las cancelaciones no confirmadas o inválidas deja el estado y los demás datos sin cambios.
- **CE-003**: En las pruebas de aceptación, el 100 % de los turnos cancelados deja de aparecer y de contarse en la fila, sin alterar el orden relativo de los turnos restantes.
- **CE-004**: En las pruebas de aceptación, ningún número de turno cancelado se asigna de nuevo a otro turno.
- **CE-005**: Después de cerrar y volver a abrir la aplicación, el 100 % de los turnos cancelados conserva su número, estado y fecha y hora de cancelación.
- **CE-006**: En una prueba de aceptación, el recepcionista puede identificar un turno, revisar la confirmación y completar o rechazar la cancelación en menos de 30 segundos.

## Supuestos

- SPEC-02 proporciona turnos con número, servicio y estado, y define la secuencia correlativa que debe continuar sin reutilizar números cancelados.
- SPEC-03 muestra únicamente turnos «Esperando» y calcula posiciones y totales a partir de los turnos elegibles; por tanto, la exclusión de un turno cancelado actualiza esos valores sin reordenar los restantes.
- La fecha y hora de cancelación corresponden al momento en que se confirma el cambio a «Cancelado».
- Si el turno ya no está «Esperando» al confirmarse, la operación se rechaza porque su cancelación dejó de ser válida.
- Cancelar un turno no notifica al cliente; corresponde al recepcionista comunicar la información por otros medios, si fuese necesario.
- La prioridad de esta especificación es secundaria (P2) frente a los flujos esenciales de registro, generación, consulta y llamada de turnos.
