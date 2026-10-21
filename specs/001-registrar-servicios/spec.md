# Feature Specification: Registrar y consultar servicios de atención (RF01)

**Feature Branch**: `no creada`

**Created**: 2026-10-14

**Status**: Draft

**Input**: SPEC-01: Registrar y consultar servicios de atención (RF01). El recepcionista registra servicios indicando nombre y prefijo, consulta la lista y conserva los datos al cerrar y volver a abrir la aplicación. El nombre y el prefijo son obligatorios; el prefijo se guarda en mayúscula y es único sin importar la capitalización. Se excluyen la edición y eliminación de servicios, usuarios o roles, así como las pantallas para el público.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar servicio (Priority: P1)

El recepcionista registra un servicio con su nombre y prefijo para identificarlo y disponer de él en la administración de turnos.

**Why this priority**: Registrar servicios es la capacidad principal que permite configurar los tipos de atención del sistema.

**Independent Test**: Registrar un servicio con datos válidos y verificar que queda disponible en la lista, con el prefijo en mayúscula y un mensaje de confirmación.

**Acceptance Scenarios**:

1. **Given** que no existe un servicio con el prefijo indicado, **When** el recepcionista registra un nombre y un prefijo válidos, **Then** el servicio aparece en la lista y se muestra un mensaje de confirmación.
2. **Given** que no existe un servicio con el prefijo «C», **When** el recepcionista registra el prefijo «c», **Then** el servicio se guarda y se muestra con el prefijo «C».
3. **Given** que el nombre o el prefijo está vacío o contiene únicamente espacios, **When** el recepcionista intenta registrar el servicio, **Then** la operación se rechaza con un mensaje claro y no se guarda ningún servicio.
4. **Given** que ya existe un servicio con el prefijo «C», **When** el recepcionista intenta registrar otro servicio con «c», **Then** la operación se rechaza con un mensaje que indica que el prefijo ya está en uso y no se guarda ningún servicio.
5. **Given** que el nombre supera los 100 caracteres o el prefijo supera los 5 caracteres, **When** el recepcionista intenta registrar el servicio, **Then** la operación se rechaza con un mensaje claro y no se guarda ningún servicio.

### User Story 2 - Consultar servicios registrados (Priority: P1)

El recepcionista consulta la lista de servicios para conocer cuáles están configurados.

**Why this priority**: La lista permite comprobar la configuración existente y verificar el resultado del registro.

**Independent Test**: Consultar la lista con uno o más servicios registrados y comprobar que muestra cada nombre y su prefijo almacenado en mayúscula.

**Acceptance Scenarios**:

1. **Given** que hay servicios registrados, **When** el recepcionista consulta la lista, **Then** se muestran todos los servicios registrados con sus nombres y prefijos.
2. **Given** que no hay servicios registrados, **When** el recepcionista consulta la lista, **Then** se informa claramente que la lista está vacía.
3. **Given** que se registraron servicios y se cerró la aplicación, **When** el recepcionista vuelve a abrirla y consulta la lista, **Then** los servicios siguen disponibles con sus datos.

### Edge Cases

- Un nombre o prefijo compuesto solo por espacios se considera vacío y no se acepta.
- El nombre no puede superar los 100 caracteres y el prefijo no puede superar los 5 caracteres, después de recortar los espacios al inicio y al final.
- Las diferencias de mayúsculas y minúsculas en el prefijo no permiten duplicados; la comparación considera el prefijo normalizado en mayúsculas.
- La lista sin servicios debe mostrar un estado vacío comprensible, no aparentar que hubo un error.
- Si el registro se rechaza por datos vacíos o prefijo duplicado, la lista y los datos guardados permanecen sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al recepcionista registrar un servicio indicando su nombre y prefijo.
- **FR-002**: El sistema MUST rechazar el registro si el nombre o el prefijo está vacío o contiene únicamente espacios, informar el motivo con un mensaje claro y no guardar el servicio.
- **FR-003**: El sistema MUST guardar y mostrar el prefijo en mayúsculas, independientemente de cómo se haya escrito.
- **FR-004**: El sistema MUST impedir que se registre un prefijo ya utilizado, sin distinguir entre mayúsculas y minúsculas, e informar que el prefijo está en uso.
- **FR-005**: El sistema MUST confirmar con un mensaje claro cada registro exitoso y mostrar el servicio recién registrado en la lista.
- **FR-006**: El sistema MUST permitir al recepcionista consultar todos los servicios registrados, mostrando nombre y prefijo; si no hay servicios, MUST indicar que la lista está vacía.
- **FR-007**: El sistema MUST conservar los servicios registrados al cerrar y volver a abrir la aplicación.
- **FR-008**: El sistema MUST limitar esta funcionalidad a registrar y consultar servicios; la edición y eliminación de servicios, la gestión de usuarios o roles y las pantallas para el público quedan fuera de alcance.
- **FR-009**: El sistema MUST rechazar el registro si el nombre supera los 100 caracteres o el prefijo supera los 5 caracteres, después de recortar los espacios al inicio y al final; MUST informar el motivo con un mensaje claro y no guardar el servicio.

### Key Entities *(include if feature involves data)*

- **Servicio de atención**: Tipo de atención que ofrece el establecimiento; contiene un nombre obligatorio de hasta 100 caracteres y un prefijo obligatorio de hasta 5 caracteres, normalizado en mayúsculas y único sin distinción de capitalización.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En las pruebas de aceptación, el 100 % de los registros válidos aparecen en la lista con nombre y prefijo normalizado, acompañados de una confirmación.
- **SC-002**: En las pruebas de aceptación, el 100 % de los intentos con nombre vacío, prefijo vacío, nombre de más de 100 caracteres, prefijo de más de 5 caracteres o prefijo duplicado se rechazan con un mensaje que explica el motivo y sin alterar los datos guardados.
- **SC-003**: Después de cerrar y volver a abrir la aplicación, el 100 % de los servicios registrados previamente continúa visible con sus datos.
- **SC-004**: Un recepcionista puede registrar un servicio válido y localizarlo en la lista en menos de un minuto durante una prueba de aceptación.

## Assumptions

- El único usuario de esta funcionalidad es el recepcionista; no se requiere autenticación, gestión de roles ni interacción de clientes.
- Se eliminan los espacios al inicio y al final del nombre y del prefijo antes de validar o guardar; los valores vacíos después de ese ajuste se rechazan.
- No se especifica un patrón de caracteres para nombres o prefijos; se acepta cualquier valor no vacío que respete los máximos de 100 caracteres para el nombre y 5 para el prefijo, sujeto a la normalización y unicidad del prefijo.
- Los nombres no tienen que ser únicos; únicamente el prefijo es único.
- La lista se presenta en un orden consistente, sin imponer un criterio de orden específico.
- La persistencia debe mantenerse entre ejecuciones de la aplicación en el mismo entorno.
