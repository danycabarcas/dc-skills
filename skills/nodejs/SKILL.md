---
name: nodejs
description: Node.js moderno (20+/LTS) - ESM, TypeScript, async, manejo de errores, APIs con Express/Fastify, configuración, seguridad y testing. Úsalo al escribir backends, scripts o CLIs en Node.
---

# Node.js

## Antes de empezar
- Versión: `node -v`, `engines` en package.json, `.nvmrc`. Gestor: mira el lockfile
  (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` → bun) y usa
  **ese** gestor.
- ¿ESM (`"type": "module"`) o CommonJS? No mezcles; en código nuevo prefiere ESM.
- ¿TypeScript? Respeta `tsconfig.json` (`strict` activado en proyectos nuevos).

## Lo que ya trae Node (no instales paquetes para esto)
- `fetch`, `AbortController`, `structuredClone`, `crypto.randomUUID()`.
- `node --watch` (en vez de nodemon), `node --env-file=.env` (en vez de dotenv en scripts simples).
- `node:test` + `node:assert` para tests sin dependencias.
- `node:fs/promises`, `node:path`, `node:util` (`parseArgs`, `styleText`), `node:sqlite` (22.13+).
- Node 22.18+/23.6+ ejecuta TypeScript con type stripping (`node app.ts`) para scripts; no
  reemplaza `tsc` para type-check.
- Importa built-ins con prefijo: `import fs from 'node:fs/promises'`.

## Estructura (API típica)
```
src/
  app.ts            # crea la app (sin listen) → testeable
  server.ts         # arranca: listen, señales
  config.ts         # lee y valida env una sola vez
  modules/users/{users.routes.ts, users.service.ts, users.schema.ts}
  lib/              # db, logger, errores
```
- Separa transporte (rutas/handlers) de lógica (servicios) y de datos (repositorios/ORM).

## Configuración
- Valida variables de entorno al arrancar (zod/valibot/envalid) y falla rápido:
  ```ts
  const Env = z.object({ PORT: z.coerce.number().default(3000), DATABASE_URL: z.string().url() });
  export const env = Env.parse(process.env);
  ```
- `.env` fuera del repo; commitea `.env.example`.

## Async y errores
- `async/await` siempre; nada de callbacks nuevos. Paraleliza con `Promise.all` cuando sea
  independiente; `Promise.allSettled` si unos pueden fallar.
- Nunca dejes promesas sin `await` ni `.catch` (rechazos no manejados tumban el proceso).
- Errores con clases propias (`class NotFoundError extends Error`) y un manejador central que los
  traduce a HTTP. No devuelvas stack traces al cliente.
- No bloquees el event loop: nada de `*Sync` en rutas, ni CPU pesada (usa worker_threads o una cola).
- Apagado limpio: escucha `SIGTERM`/`SIGINT`, cierra servidor y conexiones.

## HTTP (Express 5 / Fastify)
- Valida **toda** entrada (body, params, query) con esquemas (zod, TypeBox, JSON Schema de Fastify).
- Express 5 propaga errores de handlers async al middleware de errores; en Express 4 envuélvelos.
- Seguridad: `helmet`, CORS con lista de orígenes explícita, rate limiting, límite de tamaño del body.
- Logs estructurados (pino) con nivel por entorno; nunca loguees contraseñas/tokens.

## Seguridad
- SQL/NoSQL parametrizado (ORM o placeholders). Cuidado con inyección de operadores en Mongo
  (`{ $gt: '' }`) → valida tipos.
- Contraseñas con `argon2` o `bcrypt`. JWT con expiración corta y secretos fuertes.
- `child_process`: `execFile`/`spawn` con array de argumentos, nunca `exec` con input del usuario.
- Rutas de archivos: normaliza y verifica que queden dentro del directorio permitido.
- `npm audit` y dependencias mínimas.

## Testing
- `node:test`, Vitest o Jest (el que tenga el proyecto). Supertest para HTTP sobre `app` sin `listen`.
- Testea servicios con dependencias inyectadas/mocks; integración con DB real de pruebas si se puede.

## Errores frecuentes de agentes
- Instalar paquetes para cosas nativas (node-fetch, uuid, dotenv en scripts simples, nodemon).
- Mezclar `require` e `import`. Olvidar extensiones `.js` en imports relativos ESM compilados.
- `await` dentro de bucles secuenciales cuando podía ser paralelo (o lo contrario: paralelismo sin
  límite contra una API externa).
- Leer `process.env` disperso por el código en vez de un módulo `config`.

## Verificación
- `npm test`, `npm run lint`, `npx tsc --noEmit` (si TS), y arranca el servidor para probar un
  endpoint real.
