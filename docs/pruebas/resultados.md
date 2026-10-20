# Resultados / Results

Fecha / Date: 2026-10-20 (America/Guatemala).

## Español

- Base actualizada desde main: `08b06a0`.
- Entorno: Windows, Node.js 24.21.0, Playwright 1.62.1 y Microsoft Edge instalado, modo headless.
- Instalación reproducible: `npm ci --ignore-scripts --no-audit --no-fund`, correcta.
- Comando de ejecución: `node --test --test-reporter=tap --test-concurrency=1 tests/frontend/acceptance.test.cjs`.
- Resultado: **14 pruebas aprobadas, 0 fallidas, 0 omitidas**. Salida completa: [resultados.tap](resultados.tap).
- Capturas regeneradas de inicio, fila, atención, confirmación, móvil y atención finalizada, en [capturas](capturas/). Revisión visual de escritorio/móvil y diálogo: textos legibles y controles sin superposición.
- `git diff --check`: sin errores.

Los resultados corresponden a aceptación del frontend contra una API simulada y al servidor de vista previa. No certifican implementación .NET, persistencia, reglas de negocio ni integración completa. La suite comprueba representación y acciones de interfaz; los pendientes de aceptación integrada están detallados en [README](README.md). La revisión humana del equipo sigue pendiente.

## English

On 2026-10-20, the frontend suite ran against baseline main `08b06a0` on Windows with Node.js 24.21.0, Playwright 1.62.1 and installed headless Microsoft Edge. Clean dependency installation succeeded. The command above produced **14 passing tests, 0 failures and 0 skips**, with full TAP output linked above. Six screenshots were regenerated; desktop/mobile and dialog visual inspection found readable text and no overlapping controls. Git whitespace checks passed.

These results validate frontend behavior against a test-only API double and the preview server, not .NET business rules, durable storage or complete integration. Real-backend checks and human review remain pending as documented in the acceptance README.
