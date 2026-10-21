# Modelo de datos: SPEC-01

## Entidad: Servicio de atención

Representa un tipo de atención que ofrece el establecimiento. Solo se crea y consulta dentro del alcance de esta funcionalidad.

| Campo | Tipo en Domain | Columna SQL Server | Obligatorio | Regla |
|---|---|---|---|---|
| Identificador | `int` | `ServicioId INT IDENTITY(1,1)` | Sí | Clave primaria técnica, generada por SQL Server. |
| Nombre | `string` | `Nombre NVARCHAR(100)` | Sí | Recortar espacios al inicio y al final; rechazar vacío; máximo 100 caracteres. No es único. |
| Prefijo | `string` | `Prefijo NVARCHAR(5)` | Sí | Recortar; rechazar vacío; máximo 5 caracteres; normalizar a mayúsculas; único sin distinguir mayúsculas. |

## Tabla y restricciones

Tabla: `dbo.Servicios`.

- `ServicioId` es la clave primaria.
- `Nombre` es `NOT NULL`.
- `Prefijo` es `NOT NULL` y usa la colación `Latin1_General_100_CI_AS`, insensible a mayúsculas y sensible a acentos.
- Crear una restricción o índice único llamado `UX_Servicios_Prefijo` sobre `Prefijo`. SQL Server es la autoridad final de unicidad; el chequeo previo en Application solo mejora el mensaje y no sustituye el índice.
- Al recibir el conflicto de unicidad específico de esta columna, Infrastructure comunica el resultado de duplicado a Application; los demás errores de persistencia se informan como fallos y no se disfrazan de duplicados.
- Almacenar el prefijo ya normalizado en mayúsculas. La colación insensible a mayúsculas refuerza la unicidad ante escrituras concurrentes o valores que no pasen por la normalización de Application.
- La consulta de listado devuelve un orden determinista por `Prefijo` y `ServicioId`.
- No hay relaciones con usuarios, roles o turnos en SPEC-01.

## Validación en Domain/Application

1. Recortar espacios periféricos de `Nombre` y `Prefijo`.
2. Rechazar ambos valores si quedan vacíos.
3. Rechazar `Nombre` con más de 100 caracteres o `Prefijo` con más de 5.
4. Convertir `Prefijo` a mayúsculas invariantes antes de buscar disponibilidad y persistir.
5. Consultar unicidad para ofrecer un error oportuno; depender del índice SQL para resolver la condición de carrera.

Los límites y el resultado visible de cada rechazo se trazan a los criterios `RF01-AT-03`, `RF01-AT-04` y `RF01-AT-05` de [spec.md](./spec.md).
