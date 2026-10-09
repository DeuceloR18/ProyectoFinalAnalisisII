
# Constitución del sistema de administración de turnos

## Core Principles

### I. Desarrollo guiado por especificaciones
Ninguna funcionalidad se implementa sin una especificación aprobada. El orden
obligatorio es: problema, requerimiento, especificación, diseño, tarea,
implementación y prueba. Cada etapa debe apoyarse en el resultado aprobado de
la etapa anterior. Esto evita construir comportamientos sin necesidad o
criterios compartidos.

### II. Trazabilidad
Cada especificación tiene un identificador único secuencial con el formato
`SPEC-01`, `SPEC-02`, etc. Las tareas, commits y pruebas relacionados deben
referenciar el identificador de la especificación correspondiente. No se
considera completa una entrega si no puede rastrearse desde la especificación
hasta su evidencia de prueba.

### III. Criterios de aceptación verificables
Toda especificación debe definir reglas de negocio, restricciones y criterios
de aceptación verificables. Cada criterio se expresa en formato
Dado/Cuando/Entonces y describe un resultado observable, para que el equipo
pueda determinar objetivamente si la funcionalidad satisface el requerimiento.

### IV. Arquitectura en capas con C#/.NET
La solución se organiza en las capas Domain, Application, Infrastructure y Web.
Domain no depende de ninguna otra capa. Las reglas de negocio pertenecen a
Domain o Application, nunca a la interfaz Web ni a la base de datos. Los cambios
deben mantener esas responsabilidades y no acoplar el dominio a detalles de
presentación o persistencia.

### V. Alcance mínimo viable
El producto se limita al flujo mínimo viable definido por especificaciones
aprobadas. No se agregan funcionalidades, automatizaciones ni cambios de alcance
que no estén incluidos en una especificación aprobada. Esta restricción mantiene
el trabajo enfocado en los objetivos del proyecto final.

### VI. Pruebas con evidencia
Cada criterio de aceptación debe estar cubierto por al menos una prueba unitaria
o de aceptación. El resultado de la ejecución debe conservarse como evidencia
asociada a la especificación. Una funcionalidad no está terminada hasta que las
pruebas pertinentes pasan y su evidencia queda disponible para revisión.

### VII. UX clara y accesible
Los flujos deben ser claros y consistentes, e informar los resultados con
mensajes comprensibles de confirmación y error. La interfaz debe usar etiquetas
accesibles, contraste legible y permitir la navegación e interacción mediante
teclado. La validación de UX debe cubrir los flujos de la especificación.

### VIII. Uso responsable de IA
Todo código generado o modificado con asistencia de IA debe ser revisado y
validado por una persona del equipo antes de integrarse. Se conservan las
especificaciones usadas, las interacciones relevantes con IA, las decisiones
tomadas y las modificaciones realizadas, de modo que el equipo pueda auditar y
explicar el resultado.

### IX. Documentación bilingüe
La documentación y las especificaciones del proyecto se mantienen en español e
inglés. Las dos versiones deben conservar el mismo significado, identificadores,
reglas de negocio y criterios de aceptación; los cambios en una versión deben
reflejarse en la otra antes de aprobar la especificación.

### X. Flujo de Git trazable
Se utilizan ramas cortas por especificación o tarea. Cada commit relacionado
con una funcionalidad referencia su identificador `SPEC-XX`. El código solo se
integra en `main` cuando funciona y cumple sus pruebas y criterios de aceptación.
La revisión de integración debe confirmar la trazabilidad y la evidencia de
prueba asociadas.

## Restricciones técnicas y de alcance

El proyecto es un sistema de administración de turnos desarrollado como
proyecto final de Análisis de Sistemas II por un equipo de cuatro integrantes.
Las tecnologías y capas establecidas en estos principios son las restricciones
arquitectónicas del proyecto. Toda ampliación técnica o funcional debe seguir
el flujo de especificación y aprobación; la constitución no autoriza por sí
misma funcionalidades nuevas.

## Flujo de desarrollo y calidad

El equipo aplica el orden definido en el principio de desarrollo guiado por
especificaciones a cada funcionalidad. Antes de implementar, verifica que la
especificación esté aprobada, identificada y tenga criterios Dado/Cuando/Entonces.
Antes de integrar, verifica pruebas, evidencia, revisión humana del código
asistido por IA cuando corresponda, documentación bilingüe y referencia
`SPEC-XX` en tareas y commits. La revisión de la entrega debe registrar los
incumplimientos y resolverlos antes de integrar a `main`.

## Governance

Esta constitución rige el alcance y la forma de trabajo del equipo del proyecto.
Las enmiendas deben proponerse y aprobarse por el equipo antes de aplicarse;
deben actualizar este documento, registrar la razón del cambio e incrementar
la versión. Cada revisión de especificación y cada revisión previa a integrar
código debe verificar el cumplimiento de los principios aplicables. Las
excepciones requieren una enmienda aprobada y documentada antes de realizar el
trabajo afectado.

La versión usa SemVer (`MAJOR.MINOR.PATCH`): MAJOR para cambios incompatibles
en principios o gobernanza, MINOR para nuevos principios o ampliaciones
materiales, y PATCH para aclaraciones sin cambio semántico. La fecha de última
enmienda se actualiza con cada modificación aprobada. La ratificación inicial
debe reflejar la fecha real de aprobación; no debe inferirse.

**Version**: 1.0.0 | **Ratified**: fecha de aprobacion inicial 09/10/26
