# Sistema de Administración de Turnos

Proyecto final de **Análisis de Sistemas II**, desarrollado con **Spec-Driven Development (SDD)** usando GitHub Spec Kit.

Aplicación web para que un recepcionista administre turnos de atención: registra servicios, genera turnos con número correlativo, consulta la fila de espera, llama al siguiente turno, finaliza la atención y cancela turnos en espera.

## Integrantes

| Persona | Responsabilidad principal |
|---|---|
| Persona 1 (DANILO UCELO ) | Requerimientos y SDD: análisis, especificaciones, trazabilidad |
| Persona 2 (ARIATNA BERGANZA) | Backend: capas Domain y Application |
| Persona 3 (JUAN LECHUGA) | Infrastructure, base de datos y API |
| Persona 4 (KATHERINE) | Interfaz web, UX y diagramas C4 |
| Persona 5 (JULIO SANDOVAL) | Documentacion completa|


## Funcionalidades

| Requerimiento | Especificación | Descripción |
|---|---|---|
| RF01 | SPEC-01 | Registrar y consultar servicios (nombre y prefijo) |
| RF02 | SPEC-02 | Generar turno con número correlativo por servicio y por día |
| RF03 | SPEC-03 | Consultar la fila de espera de un servicio |
| RF04 | SPEC-04 | Llamar al siguiente turno |
| RF05 | SPEC-05 | Finalizar la atención de un turno |
| RF06 | SPEC-06 | Cancelar un turno en espera con confirmación (prioridad secundaria) |

Reglas principales: el prefijo del servicio se guarda en mayúscula, es único y tiene un máximo de 5 caracteres; los nombres tienen un máximo de 100; el número de turno es prefijo, guion y correlativo (por ejemplo `C-001`); un servicio solo puede tener un turno **En atención** a la vez. Los estados de un turno son: Esperando, En atención, Finalizado y Cancelado.

## Tecnologías

- C# y .NET 10 (SDK 10.0.302)
- ASP.NET Core (API REST) que también sirve la interfaz estática
- SQL Server con Dapper
- Interfaz en HTML, CSS y JavaScript (`wwwroot`)
- GitHub Spec Kit con GitHub Copilot para el flujo SDD

## Arquitectura

Arquitectura en capas. La capa Domain no depende de ninguna otra.

| Proyecto | Responsabilidad |
|---|---|
| `SistemaTurnos.Domain` | Entidades, estados y reglas de negocio |
| `SistemaTurnos.Application` | Casos de uso, servicios e interfaces de repositorio |
| `SistemaTurnos.Infrastructure` | Acceso a datos (SQL Server, Dapper) |
| `SistemaTurnos.Web` | API REST e interfaz web |

## Estructura del repositorio

```
.
├── .github/skills/        Comandos de Spec Kit (no modificar)
├── .specify/              Plantillas y constitution del proyecto
├── specs/                 SPEC-01 a SPEC-06: spec.md, plan.md y tasks.md
├── docs/
│   ├── analisis/          Actores, requerimientos, casos de uso, historias
│   ├── diseno/            Componentes, arquitectura y diagramas C4
│   ├── ux/                Wireframes y flujo de pantallas
│   ├── trazabilidad/      Criterio de aceptación, tarea, prueba y resultado
│   ├── pruebas/           Capturas y resultados de las pruebas
│   └── evidencia-ia/      Uso de IA por integrante
└── src/
    ├── SistemaTurnos.sln
    ├── CrearBaseDatos.sql
    ├── SistemaTurnos.Domain/
    ├── SistemaTurnos.Application/
    ├── SistemaTurnos.Infrastructure/
    └── SistemaTurnos.Web/
```

## Cómo ejecutar la aplicación

### Requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- SQL Server (Developer o Express) y SSMS, o la herramienta `sqlcmd`
- Git

### 1. Clonar el repositorio

```powershell
git clone https://github.com/DeuceloR18/ProyectoFinalAnalisisII.git
cd ProyectoFinalAnalisisII
```

### 2. Compilar

```powershell
dotnet build src\SistemaTurnos.sln
```

Debe terminar con `Build succeeded`.

### 3. Crear la base de datos

Ejecuta el script `src\CrearBaseDatos.sql` en tu instancia de SQL Server. Con SSMS: ábrelo y pulsa F5. Con `sqlcmd` (instancia predeterminada):

```powershell
sqlcmd -S localhost -E -C -i src\CrearBaseDatos.sql
```

Anota el nombre de la base de datos que crea el script (`NOMBRE_BASE`).

### 4. Configurar la cadena de conexión

No modifiques `appsettings.json`. Define tu propia cadena en la terminal antes de ejecutar.

SQL Server instancia predeterminada (Developer):

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=localhost;Database=NOMBRE_BASE;Trusted_Connection=True;TrustServerCertificate=True;"
```

SQL Server Express:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=.\SQLEXPRESS;Database=NOMBRE_BASE;Trusted_Connection=True;TrustServerCertificate=True;"
```

Si tienes ambas instancias instaladas, usa la misma en el script y en la cadena de conexión. Cambia `NOMBRE_BASE` por el nombre real de la base.

Tambien se puede hacer manual, conectado al servidor en SQL server
Ejecutar el scrip de la db 
en appsettings.js colocar el nombre del servidor ya sea localhost o SQLEXPRESS y ejecutar.

### 5. Ejecutar

```powershell
dotnet run --project src\SistemaTurnos.Web
```

Abre en el navegador la dirección que indique la consola (`Now listening on: http://localhost:PUERTO`).

### Problemas frecuentes

| Error | Causa probable |
|---|---|
| Error 26 o `A network-related error` | El nombre del servidor en la cadena no coincide con tu instancia |
| `Cannot open database` | El nombre de la base no coincide o no se ejecutó el script |
| `MSB1003` al compilar | Ejecuta `dotnet build` apuntando a `src\SistemaTurnos.sln` |

## Cómo probar el flujo

1. Registrar un servicio, por ejemplo "Caja" con prefijo `c` (se guarda como `C`).
2. Generar dos turnos para ese servicio: `C-001` y `C-002`.
3. Consultar la fila de espera.
4. Llamar siguiente: `C-001` pasa a En atención.
5. Finalizar atención: el turno actual vuelve a "Ninguno".
6. Cancelar un turno en espera y confirmar.

## Proceso SDD

El desarrollo siguió la cadena: problema, requerimiento, especificación, diseño, tarea, implementación y prueba.

- La **constitution** con las reglas del proyecto está en `.specify/memory/constitution.md`.
- Cada especificación está en `specs/00X-.../` con su `spec.md` (comportamiento y criterios de aceptación), `plan.md` (diseño técnico) y `tasks.md` (tareas).
- La relación entre criterios, tareas, pruebas y resultados está en `docs/trazabilidad/trazabilidad.md`.
- La evidencia de las pruebas de aceptación está en `docs/pruebas/capturas/`.

## Estado y limitaciones

- La verificación del sistema integrado se hizo con pruebas de aceptación manuales con capturas. **No hay pruebas automatizadas del backend** (Domain, Application, API ni integración con SQL Server): los `plan.md` las prevén, pero quedaron como trabajo pendiente.
- Existen pruebas automatizadas de navegador para una interfaz alternativa (ver la sección siguiente), pero se ejecutan contra una API simulada y **no demuestran** el comportamiento del backend real ni la persistencia.
- Los criterios que no se alcanzaron a ejecutar figuran como "No probado" en la tabla de trazabilidad.
- Diferencias conocidas entre la interfaz y las especificaciones: (COMPLETAR, por ejemplo: la fila de espera no muestra la posición de cada turno; los campos del formulario no tienen etiqueta visible).
- Funcionalidades fuera de alcance, no incluidas por no tener especificación aprobada: autenticación, reportes, pantalla pública para clientes y edición o eliminación de servicios.

## Documentación de interfaz y pruebas del prototipo (LECHUGA)

El repositorio incluye una interfaz de recepción alternativa (`src/Turnos.Web`), con wireframes y pruebas de navegador. Esa interfaz **no forma parte de la solución que se ejecuta** (`SistemaTurnos.sln`) y está escrita para un contrato de API propuesto, distinto de las rutas implementadas en `SistemaTurnos.Web`. La interfaz que se entrega y se prueba con el backend real es la de `src/SistemaTurnos.Web/wwwroot`.

- [Ejecución y contrato de API propuesto](src/Turnos.Web/README.md)
- [Wireframes y flujo](docs/ux/wireframes.md)
- [Pruebas, trazabilidad y pendientes de integración](docs/pruebas/README.md)
- [Evidencia de uso de IA del integrante 4](docs/evidencia-ia/integrante-4.md)

Para ver esa interfaz con su API simulada: `npm start` y abrir `http://127.0.0.1:5080`. Para sus pruebas: `npm ci` y `npm test`, con Node.js 20 o superior y Microsoft Edge instalado.

## Uso de inteligencia artificial

Se usó GitHub Spec Kit junto con GitHub Copilot para generar las especificaciones, los planes y las tareas, que fueron revisados y modificados por el equipo. El código es responsabilidad del equipo. La evidencia de las interacciones, las propuestas de la IA y las decisiones tomadas está en `docs/evidencia-ia/`.