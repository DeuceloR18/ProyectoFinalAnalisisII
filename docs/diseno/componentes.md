# Componentes y responsabilidades / Components and responsibilities

> Estado / Status: Borrador para revisión del equipo / Draft for team review

---

## 🇪🇸 Español

### Componentes por capa

| Capa (proyecto) | Componente | Responsabilidad | Req. |
|-----------------|------------|-----------------|------|
| **Domain** (`Turnos.Domain`) | `Servicio` (entidad) | Nombre y prefijo; valida que no estén vacíos (RN-01, RN-02). | RF01 |
| | `Turno` (entidad) | Número, servicio, fecha, estado. Expone las transiciones `Llamar()`, `Finalizar()` y `Cancelar()` y rechaza las inválidas (RN-07, RN-09 a RN-11). | RF02 a RF06 |
| | `EstadoTurno` (enum) | `EnEspera`, `EnAtencion`, `Finalizado`, `Cancelado`. | RF02 a RF06 |
| | `NumeroTurno` (valor) | Formato `prefijo + correlativo` (RN-04). | RF02 |
| | Excepciones de dominio | Errores de regla de negocio con mensaje comprensible. | Todos |
| **Application** (`Turnos.Application`) | `IServicioRepository`, `ITurnoRepository` | Contratos de persistencia (definidos aquí, implementados en Infrastructure). | Todos |
| | `ServicioService` | Casos de uso CU-01 y CU-02: registrar y consultar servicios; valida unicidad (RN-02). | RF01 |
| | `TurnoService` | Casos de uso CU-03 a CU-07: generar (correlativo del día), consultar fila, llamar siguiente, finalizar, cancelar. Orquesta entidades y repositorios. | RF02 a RF06 |
| | DTOs / resultados | Datos que se devuelven a Web sin exponer entidades. | Todos |
| **Infrastructure** (`Turnos.Infrastructure`) | `ServicioRepository`, `TurnoRepository` | Implementan los contratos contra la base de datos. | Todos |
| | Acceso a datos y esquema | Tablas `Servicio` y `Turno` (script en `database/`). | Todos |
| **Web** (`Turnos.Web`) | Endpoints / controladores | Reciben solicitudes HTTP, llaman a Application y devuelven JSON y códigos de error claros. | Todos |
| | Interfaz HTML/CSS/JS | Pantalla principal del recepcionista: servicios, generar turno, fila, llamar, finalizar, cancelar con confirmación (wireframes en `docs/ux`). | Todos |
| | Composición de dependencias | Registra repositorios y servicios (inyección de dependencias). | — |
| **Tests** (`Turnos.Tests`) | Pruebas unitarias de Domain y Application | Una prueba por criterio de aceptación (RNF-03). | Todos |

### Dónde vive cada regla de negocio

| Regla | Capa | Motivo |
|-------|------|--------|
| RN-01, RN-02 (campos obligatorios) | Domain | Invariante de la entidad. |
| RN-02 (unicidad entre servicios) | Application | Requiere consultar el repositorio. |
| RN-03 (servicio existente) | Application | Requiere consultar el repositorio. |
| RN-04 (correlativo del día) | Application + Domain | Application obtiene el último número del día; Domain da formato. |
| RN-05 a RN-11 (estados y transiciones) | Domain | Invariantes del `Turno`. |
| RN-06, RN-07 (orden de llegada) | Application | Consulta ordenada por repositorio. |
| Confirmación al cancelar (RN-10) | Web (pedirla) + Application (exigirla) | La UI pregunta; el caso de uso rechaza si no llega confirmada. |

---

## 🇬🇧 English

### Components per layer

| Layer (project) | Component | Responsibility | Req. |
|-----------------|-----------|----------------|------|
| **Domain** (`Turnos.Domain`) | `Servicio` (entity) | Name and prefix; validates they are not empty (RN-01, RN-02). | RF01 |
| | `Turno` (entity) | Number, service, date, state. Exposes transitions `Llamar()`, `Finalizar()` and `Cancelar()` and rejects invalid ones (RN-07, RN-09 to RN-11). | RF02 to RF06 |
| | `EstadoTurno` (enum) | `EnEspera`, `EnAtencion`, `Finalizado`, `Cancelado`. | RF02 to RF06 |
| | `NumeroTurno` (value) | Format `prefix + sequence` (RN-04). | RF02 |
| | Domain exceptions | Business-rule errors with understandable messages. | All |
| **Application** (`Turnos.Application`) | `IServicioRepository`, `ITurnoRepository` | Persistence contracts (defined here, implemented in Infrastructure). | All |
| | `ServicioService` | Use cases CU-01 and CU-02: register and list services; enforces uniqueness (RN-02). | RF01 |
| | `TurnoService` | Use cases CU-03 to CU-07: generate (daily sequence), view queue, call next, finish, cancel. Orchestrates entities and repositories. | RF02 to RF06 |
| | DTOs / results | Data returned to Web without exposing entities. | All |
| **Infrastructure** (`Turnos.Infrastructure`) | `ServicioRepository`, `TurnoRepository` | Implement the contracts against the database. | All |
| | Data access and schema | Tables `Servicio` and `Turno` (script in `database/`). | All |
| **Web** (`Turnos.Web`) | Endpoints / controllers | Receive HTTP requests, call Application and return JSON and clear error codes. | All |
| | HTML/CSS/JS interface | Receptionist's main screen: services, generate ticket, queue, call, finish, cancel with confirmation (wireframes in `docs/ux`). | All |
| | Dependency composition | Registers repositories and services (dependency injection). | — |
| **Tests** (`Turnos.Tests`) | Domain and Application unit tests | One test per acceptance criterion (RNF-03). | All |

### Where each business rule lives

| Rule | Layer | Reason |
|------|-------|--------|
| RN-01, RN-02 (required fields) | Domain | Entity invariant. |
| RN-02 (uniqueness across services) | Application | Needs to query the repository. |
| RN-03 (existing service) | Application | Needs to query the repository. |
| RN-04 (daily sequence) | Application + Domain | Application gets the day's last number; Domain formats it. |
| RN-05 to RN-11 (states and transitions) | Domain | `Turno` invariants. |
| RN-06, RN-07 (arrival order) | Application | Ordered query through the repository. |
| Confirmation on cancel (RN-10) | Web (asks) + Application (enforces) | The UI asks; the use case rejects if not confirmed. |
