# Historias de usuario / User stories

> Los criterios usan formato Dado/Cuando/Entonces (constitución, principio III). Son insumo para las specs; la versión aprobada vive en `specs/`.
> Criteria use Given/When/Then format (constitution, principle III). They feed the specs; the approved version lives in `specs/`.

---

## 🇪🇸 Español

### HU-01 · Registrar y consultar servicios (RF01 · SPEC-01 · Alta)
**Como** recepcionista, **quiero** registrar y consultar servicios con nombre y prefijo, **para** poder generar turnos por tipo de atención.
- **Dado** que no existe un servicio con ese nombre ni prefijo, **cuando** registro "Caja" con prefijo "C", **entonces** el servicio queda guardado y aparece en la lista.
- **Dado** que ya existe el prefijo "C", **cuando** intento registrar otro servicio con prefijo "C", **entonces** veo un mensaje de error y no se guarda.
- **Dado** que dejo el nombre vacío, **cuando** intento registrar, **entonces** veo un mensaje de error y no se guarda.

### HU-02 · Generar turno (RF02 · SPEC-02 · Alta)
**Como** recepcionista, **quiero** generar un turno para un servicio, **para** entregar al cliente un número que defina su orden.
- **Dado** el servicio "Caja" (prefijo C) sin turnos hoy, **cuando** genero un turno, **entonces** se crea `C-001` En espera.
- **Dado** que existe `C-001` hoy, **cuando** genero otro turno, **entonces** se crea `C-002`.
- **Dado** que hay turnos del día anterior, **cuando** genero el primer turno de hoy, **entonces** el correlativo vuelve a `001`.

### HU-03 · Consultar fila de espera (RF03 · SPEC-03 · Alta)
**Como** recepcionista, **quiero** ver la fila de un servicio, **para** saber cuántas personas esperan y en qué orden.
- **Dado** que hay `C-001`, `C-002` y `C-003` En espera, **cuando** consulto la fila de "Caja", **entonces** los veo en ese orden y la cantidad es 3.
- **Dado** que un turno está En atención, **cuando** consulto la fila, **entonces** ese turno no aparece.
- **Dado** que no hay turnos En espera, **cuando** consulto la fila, **entonces** veo "No hay turnos en espera".

### HU-04 · Llamar al siguiente turno (RF04 · SPEC-04 · Alta)
**Como** recepcionista, **quiero** llamar al siguiente turno, **para** atender a los clientes en orden de llegada.
- **Dado** `C-001` y `C-002` En espera, **cuando** llamo al siguiente, **entonces** `C-001` pasa a En atención y se muestra su número.
- **Dado** que no hay turnos En espera, **cuando** llamo al siguiente, **entonces** veo que la fila está vacía y nada cambia.

### HU-05 · Finalizar atención (RF05 · SPEC-05 · Alta)
**Como** recepcionista, **quiero** finalizar la atención de un turno, **para** cerrar el ciclo y poder llamar al siguiente.
- **Dado** `C-001` En atención, **cuando** lo finalizo, **entonces** pasa a Finalizado.
- **Dado** un turno En espera, **cuando** intento finalizarlo, **entonces** veo un error y no cambia de estado.

### HU-06 · Cancelar turno (RF06 · SPEC-06 · Secundaria)
**Como** recepcionista, **quiero** cancelar un turno en espera con confirmación, **para** retirar a quien ya no desea ser atendido sin errores accidentales.
- **Dado** `C-002` En espera, **cuando** pido cancelarlo y confirmo, **entonces** pasa a Cancelado y sale de la fila.
- **Dado** `C-002` En espera, **cuando** pido cancelarlo y no confirmo, **entonces** sigue En espera.
- **Dado** un turno En atención o Finalizado, **cuando** intento cancelarlo, **entonces** veo un error y no cambia.

---

## 🇬🇧 English

### US-01 · Register and list services (RF01 · SPEC-01 · High)
**As** a receptionist, **I want** to register and list services with name and prefix, **so that** I can generate tickets per type of service.
- **Given** no service with that name or prefix exists, **when** I register "Cashier" with prefix "C", **then** the service is saved and appears in the list.
- **Given** prefix "C" already exists, **when** I try to register another service with prefix "C", **then** I see an error message and nothing is saved.
- **Given** I leave the name empty, **when** I try to register, **then** I see an error message and nothing is saved.

### US-02 · Generate ticket (RF02 · SPEC-02 · High)
**As** a receptionist, **I want** to generate a ticket for a service, **so that** I can hand the customer a number that defines their order.
- **Given** service "Cashier" (prefix C) with no tickets today, **when** I generate a ticket, **then** `C-001` is created as Waiting.
- **Given** `C-001` exists today, **when** I generate another ticket, **then** `C-002` is created.
- **Given** tickets from the previous day exist, **when** I generate today's first ticket, **then** the sequence restarts at `001`.

### US-03 · View waiting queue (RF03 · SPEC-03 · High)
**As** a receptionist, **I want** to see a service's queue, **so that** I know how many people are waiting and in what order.
- **Given** `C-001`, `C-002` and `C-003` are Waiting, **when** I view the "Cashier" queue, **then** I see them in that order and the count is 3.
- **Given** a ticket is In service, **when** I view the queue, **then** that ticket does not appear.
- **Given** no tickets are Waiting, **when** I view the queue, **then** I see "No tickets waiting".

### US-04 · Call next ticket (RF04 · SPEC-04 · High)
**As** a receptionist, **I want** to call the next ticket, **so that** customers are served in arrival order.
- **Given** `C-001` and `C-002` are Waiting, **when** I call next, **then** `C-001` becomes In service and its number is shown.
- **Given** no tickets are Waiting, **when** I call next, **then** I see the queue is empty and nothing changes.

### US-05 · Finish service (RF05 · SPEC-05 · High)
**As** a receptionist, **I want** to finish a ticket's service, **so that** I close the cycle and can call the next one.
- **Given** `C-001` is In service, **when** I finish it, **then** it becomes Finished.
- **Given** a Waiting ticket, **when** I try to finish it, **then** I see an error and its state does not change.

### US-06 · Cancel ticket (RF06 · SPEC-06 · Secondary)
**As** a receptionist, **I want** to cancel a waiting ticket with confirmation, **so that** I remove someone who no longer wants service without accidental mistakes.
- **Given** `C-002` is Waiting, **when** I request cancellation and confirm, **then** it becomes Cancelled and leaves the queue.
- **Given** `C-002` is Waiting, **when** I request cancellation and do not confirm, **then** it stays Waiting.
- **Given** a ticket that is In service or Finished, **when** I try to cancel it, **then** I see an error and nothing changes.
