# Evidencia de uso de IA: Persona 1 (Danilo)

Responsabilidad: requerimientos y SDD (constitution, especificaciones, planes, tareas, trazabilidad).

## 1. Herramientas utilizadas

| Herramienta | Para qué se usó |
|---|---|
| GitHub Spec Kit (`specify-cli` 1.0.1) | Estructura del proceso SDD: constitution, specify, plan y tasks |
| GitHub Copilot en VS Code (modo Agent) | Ejecutar las skills de Spec Kit y generar `spec.md`, `plan.md`, `tasks.md` y la tabla de trazabilidad |
| Claude (chat) | Orientación sobre el proceso, redacción de los textos que se enviaron a Copilot y revisión de errores de configuración |

Intento descartado: Claude Code como agente. Requiere plan de pago, por lo que se usó Copilot.

## 2. Cómo se trabajó con la IA

Para cada artefacto se siguió el mismo ciclo:

1. El equipo redactó la descripción del comportamiento esperado a partir de la propuesta aprobada (sin tecnología, solo qué debe hacer el sistema).
2. Se la pasó a la skill de Spec Kit correspondiente en Copilot.
3. Se revisó lo generado contra la propuesta y las decisiones del equipo.
4. Se corrigió lo que no coincidía y se subió por rama y Pull Request para revisión del equipo.

## 3. Interacciones relevantes


| 1 | (fecha) | Copilot, `speckit-constitution` | Constitution con 10 principios del proyecto (SDD, trazabilidad, capas, pruebas, UX, IA responsable, idioma, flujo Git) | Constitution en `.specify/memory/constitution.md`; en el principio de idioma indicó español e inglés | El equipo definió solo español y corrigió el archivo a mano (confirmar) | Captura del chat y `git log` de constitution.md |
| 2 | (fecha) | Copilot, `speckit-specify` | SPEC-01 a SPEC-06, una por requerimiento (RF01 a RF06), con reglas y criterios Dado/Cuando/Entonces | `spec.md` y `checklists/requirements.md` por cada spec; salieron bilingües | Se dejó solo la versión en español; se revisó que cada spec conservara las reglas y criterios pedidos | Carpeta `specs/` |
| 3 | (fecha) | Copilot, `speckit-plan` (SPEC-01) | Plan técnico con capas, SQL Server con Dapper, API REST y tabla criterio-prueba | Preguntó qué longitud máxima usar para el prefijo y sugirió 450 caracteres por el límite del índice de SQL Server | El equipo decidió 5 caracteres para el prefijo y 100 para el nombre, porque el prefijo forma el número de turno (C-001). Se actualizó primero la spec con la regla y su criterio de aceptación, y luego el plan | `specs/001-.../spec.md` y `plan.md` |
| 4 | (fecha) | Copilot, `speckit-plan` (SPEC-02 a SPEC-06) | Planes que reutilizan las decisiones de SPEC-01 y describen solo lo nuevo | Planes con modelo de datos, endpoints y tabla criterio-prueba | Decisiones del equipo: correlativo por servicio y por día, un solo turno En atención por servicio garantizado en la base de datos, número cancelado no reutilizable, confirmación al cancelar en la interfaz | `plan.md` de cada spec |
| 5 | (fecha) | Copilot, `speckit-tasks` | Tareas por spec con identificador, criterio asociado, responsable por capa y pruebas | `tasks.md` por spec | Se revisó el reparto entre Personas 2, 3 y 4 y que cada criterio tuviera tarea de prueba | `tasks.md` de cada spec |
| 6 | (fecha) | Copilot | Tabla de trazabilidad a partir de las specs, planes y tareas | `docs/trazabilidad/trazabilidad.md` con una fila por criterio | Se completaron Resultado y Evidencia solo donde existe captura; el resto quedó "No probado" y las diferencias se declararon en las notas | `docs/trazabilidad/` |

## 4. Propuestas de la IA que se rechazaron o se limitaron

| Situación | Decisión |
|---|---|
| Copilot pidió descargar una página de documentación externa para apoyar el plan | Se rechazó: las decisiones técnicas ya las había definido el equipo |
| Copilot intentó explorar carpetas fuera del proyecto (Escritorio) | Se rechazó el permiso y se limitó el trabajo a la carpeta del repositorio |
| Sugerencia de 450 caracteres para el prefijo | Se reemplazó por 5 (ver interacción 3) |
| Idioma bilingüe en la constitution y en las specs | Se dejó solo español |

## 5. Validación de los resultados

- Cada spec, plan y tarea se subió por rama y Pull Request y fue revisado por el equipo antes del merge.
- Se contrastó el sistema implementado contra los criterios de aceptación de las specs, con pruebas manuales y capturas en `docs/pruebas/capturas/`.
- Las diferencias y lo no probado están declarados en `docs/trazabilidad/trazabilidad.md`.

## 6. Responsabilidad del equipo

La IA generó borradores. Las decisiones de alcance, reglas de negocio y límites fueron del equipo y el código y los documentos entregados son responsabilidad de los integrantes.
