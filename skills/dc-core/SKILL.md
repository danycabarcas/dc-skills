---
name: dc-core
description: Protocolo base DAYTECHCO para cualquier proyecto - cómo trabajar, usar la memoria compartida, elegir skills y entregar cambios. Úsalo siempre al iniciar una sesión.
---

# DC Core · protocolo de trabajo

Reglas que aplican a **todo** proyecto, sin importar el stack. Los skills de tecnología
(php, laravel, react, ...) se suman a estas reglas, no las reemplazan.

## 1. Arranque de sesión
1. Ejecuta `dc-skills agent-start` (o la herramienta MCP `skills_status`). Te da los skills
   instalados, lo detectado en el proyecto y la memoria reciente.
2. Si no hay skills instalados, **pregunta** al usuario qué va a construir, ejecuta
   `dc-skills recommend "<su descripción>"`, muéstrale la recomendación y deja que elija.
   Instala con `dc-skills add <a> <b> --yes`.
3. Lee los `SKILL.md` de las tecnologías que vas a tocar. No los leas todos si no hacen falta.

## 2. Memoria compartida (todos los agentes escriben aquí)
Identifícate siempre con `--agent <claude|gemini|codex|kimi|...>` o la variable `DC_AGENT`.

| Cuándo | Comando |
|---|---|
| Antes de investigar un problema | `dc-skills mem search "<tema>"` |
| Se tomó una decisión de arquitectura/stack | `dc-skills mem add "<qué y por qué>" --kind decision` |
| Se definió una convención del proyecto | `dc-skills mem add "..." --kind convention` |
| Se resolvió un bug no obvio | `dc-skills mem add "<síntoma → causa → solución>" --kind bug` |
| Queda trabajo pendiente | `dc-skills mem add "..." --kind todo` |
| Terminaste un bloque de trabajo | `dc-skills log "<qué hiciste>"` |
| Preferencia del usuario para todos sus proyectos | `dc-skills mem add "..." --global` |

Buenas memorias: cortas, autocontenidas, con el **porqué**. No guardes lo que ya está en el
código o en git, ni secretos (tokens, contraseñas, .env).

## 3. Forma de trabajar
- **Lee antes de escribir**: estructura, convenciones existentes, versión real de cada
  dependencia (composer.json, package.json, lockfiles). El código nuevo debe parecer escrito
  por el mismo equipo.
- **Cambios pequeños y verificables.** Después de cada cambio corre lo que exista: tests,
  linter, type-check, build. Si algo falla, dilo con la salida real; no lo escondas.
- **No inventes APIs.** Si no estás seguro de una firma o de la versión, revisa el código del
  vendor/node_modules o la documentación oficial.
- **No agregues dependencias** sin decir por qué y sin que el usuario lo acepte.
- **Seguridad por defecto**: valida entradas, escapa salidas, consultas parametrizadas,
  autorización en el servidor, nada de secretos en el repo.
- **Idioma**: responde en el idioma del usuario; código, nombres y commits en inglés salvo que
  el proyecto ya use otra convención.

## 4. Git
- No hagas commit/push si el usuario no lo pidió. Nunca en `main` directo si hay ramas.
- Mensajes en imperativo y en inglés: `feat: add invoice export`, `fix: ...`, `refactor: ...`.
- Nunca `--force`, `reset --hard` ni borrar ramas sin confirmación.

## 5. Falta un skill
Si el proyecto usa una tecnología sin skill (Vue, Python, Docker...):
1. `dc-skills request <nombre> "<motivo>"` y avísale al usuario.
2. Si el usuario quiere, créalo: `dc-skills new <nombre>` y complétalo siguiendo el skill
   `skill-creator`.

## 6. Entrega
Al terminar, resume en pocas líneas: qué cambió, cómo se verificó, qué quedó pendiente
(y guárdalo como `todo` si aplica).
