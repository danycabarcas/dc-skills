# AGENTS.md · dc-skills (repo del catálogo)

Este repo es la herramienta `dc-skills` y su catálogo de skills. Si trabajas aquí:

## Código (`bin/`, `src/`)
- Node.js >= 22.13, ESM, **cero dependencias** (usa `node:sqlite`, `node:http`, `node:readline`).
  No agregues paquetes de npm.
- Textos para el usuario en español; código e identificadores en inglés.
- La salida de `dc-skills mcp` por stdout es solo JSON-RPC: nunca hagas `console.log` en ese camino.
- Verifica con `npm test` y probando el comando real: `node bin/dc-skills.js <comando>`.
  Para no tocar la memoria real usa `DC_SKILLS_HOME=<carpeta temporal>`.

## Skills (`skills/<nombre>/`)
- Sigue `skills/skill-creator/SKILL.md`: `SKILL.md` con frontmatter `name` + `description`, y
  `dc.json` con `category`, `requires` y `detect`.
- Reglas concretas y verificables, ejemplos correctos, diferencias por versión. Nada de APIs
  inventadas: si dudas de un detalle de versión, no lo pongas.
- Tras cambiar un skill, `npm test` valida nombres, descripciones y `requires`.
