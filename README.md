# ProyectoFinalAnalisisII
Sistema de administración de turnos desarrollado con Spec-Driven Development (GitHub Spec Kit) y arquitectura en capas en C#/.NET. Análisis de Sistemas II.

## Frontend y pruebas / Frontend and tests

La entrega del integrante 4 incluye la interfaz de recepción para SPEC-01 a SPEC-06, wireframes, flujo y pruebas automatizadas con capturas. El backend .NET todavía no está implementado en esta base: la interfaz requiere el contrato propuesto y las pruebas usan una API simulada exclusiva de pruebas. No se afirma aceptación integrada ni persistencia real.

- [Ejecución y contrato de API](src/Turnos.Web/README.md)
- [Wireframes y flujo](docs/ux/wireframes.md)
- [Pruebas, trazabilidad y pendientes de integración](docs/pruebas/README.md)
- [Evidencia de uso de IA](docs/evidencia-ia/integrante-4.md)

Vista de la interfaz: `npm start` y abrir `http://127.0.0.1:5080`. Pruebas: `npm ci` y `npm test` con Node.js 20+ y Microsoft Edge instalado.

Member 4 provides the receptionist UI, wireframes, flow and browser tests for SPEC-01 through SPEC-06. The .NET backend is not yet implemented in this baseline. Tests use an isolated API double and do not prove backend correctness or durable persistence. See the bilingual documents above for the proposed API contract, execution instructions, traceability and remaining integration checks.
