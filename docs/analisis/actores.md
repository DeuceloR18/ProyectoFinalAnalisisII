# Actores del sistema / System actors

> Proyecto: Sistema de administración de turnos · Análisis de Sistemas II
> Estado / Status: Borrador para revisión del equipo / Draft for team review

---

## 🇪🇸 Español

### Problema
Los negocios con atención al público (clínicas, bancos, oficinas) necesitan ordenar la fila de clientes sin papeles ni confusión. Hoy el orden de llegada se lleva de forma manual, lo que genera disputas, pérdida de turnos y falta de control sobre cuántas personas esperan por servicio. El sistema permite a una persona en recepción generar, consultar, llamar, finalizar y cancelar turnos por servicio.

### Actor principal

| ID | Actor | Descripción | Funciones que usa |
|----|-------|-------------|-------------------|
| ACT-01 | **Recepcionista** | Persona que opera el sistema en el mostrador. Registra servicios, entrega números de turno, llama al siguiente cliente y cierra o cancela la atención. | RF01 a RF06 (todas) |

### Actores externos (no usan el sistema)

| ID | Actor | Descripción | Relación con el sistema |
|----|-------|-------------|-------------------------|
| ACT-02 | **Cliente** | Persona que solicita atención. **No usa el sistema**: solo recibe su número de turno (por ejemplo `A-001`) de parte del recepcionista y espera a ser llamado. | Es el beneficiario del turno; interactúa únicamente con el recepcionista. |

### Fuera de alcance
Administrador del sistema, pantalla pública para clientes, autoservicio de turnos, notificaciones por mensaje y múltiples ventanillas **no** forman parte del alcance mínimo viable (constitución, principio V).

---

## 🇬🇧 English

### Problem
Businesses that serve the public (clinics, banks, offices) need to organize customer queues without paper or confusion. Arrival order is currently tracked by hand, causing disputes, lost turns and no control over how many people wait per service. The system lets a front-desk person generate, view, call, finish and cancel tickets per service.

### Primary actor

| ID | Actor | Description | Functions used |
|----|-------|-------------|----------------|
| ACT-01 | **Receptionist** | Person who operates the system at the counter. Registers services, hands out ticket numbers, calls the next customer and closes or cancels the service. | RF01 to RF06 (all) |

### External actors (do not use the system)

| ID | Actor | Description | Relationship with the system |
|----|-------|-------------|------------------------------|
| ACT-02 | **Customer** | Person requesting service. **Does not use the system**: only receives a ticket number (e.g. `A-001`) from the receptionist and waits to be called. | Beneficiary of the ticket; interacts only with the receptionist. |

### Out of scope
System administrator, public display for customers, self-service ticketing, message notifications and multiple service windows are **not** part of the minimum viable scope (constitution, principle V).
