# DC Skills · DAYTECHCO

Skills para agentes de IA de desarrollo (Claude Code, Gemini CLI, Codex, Kimi, Cursor...) +
un instalador por proyecto + memoria compartida entre agentes. Sin dependencias: solo Node.js.

```
dc-skills            → menú: detecta tu proyecto, recomienda skills, instala, memoria, dashboard
```

## Qué incluye

| Pieza | Qué hace |
|---|---|
| **Catálogo de skills** (`skills/`) | Instrucciones por tecnología en formato estándar *Agent Skills* (`SKILL.md`): php, laravel, filament, html, css, tailwind, nodejs, react, nextjs, nestjs, angular, + `dc-core` (protocolo base) y `skill-creator`. |
| **Orquestador** (`src/detect.js`) | Algoritmo sin IA: lee `composer.json`, `package.json`, archivos marcadores y tu descripción, puntúa cada skill y agrega sus requisitos (filament → laravel → php). |
| **Instalador** | Copia los skills elegidos al proyecto y escribe `AGENTS.md` (+ `CLAUDE.md`/`GEMINI.md` que lo importan) para que cualquier agente los use. |
| **Memoria compartida** | SQLite en `~/.dc-skills/memory.db`, con búsqueda full-text. Todos los agentes leen y escriben ahí (CLI o MCP). |
| **Dashboard** | `dc-skills serve --open`: página local para ver memoria, logs y skills pedidos. Se apaga con un botón. |
| **Servidor MCP** | `dc-skills mcp`: herramientas nativas (`memory_add`, `memory_search`, `skills_status`...) para agentes con MCP. |

## Instalación

Requisitos: **Node.js 22.13+** (recomendado 24 LTS) y git.

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/danycabarcas/dc-skills/main/install.ps1 | iex
```
**Linux / macOS / Git Bash:**
```sh
curl -fsSL https://raw.githubusercontent.com/danycabarcas/dc-skills/main/install.sh | sh
```
**O con npm directamente:** `npm install -g github:danycabarcas/dc-skills`

**Si mantienes el catálogo** (clonaste el repo para editar skills):
```sh
cd dc-skills && npm install -g .     # enlaza el comando a tu carpeta: lo que edites se usa al instante
```

Verifica con `dc-skills doctor`.

## Uso en un proyecto

```sh
cd C:\laragon\www\mi-proyecto
dc-skills
```
1. Describe el proyecto (o Enter para solo detectar).
2. Se marcan con ★ los recomendados; eliges números o nombres.
3. Se crean en el proyecto:
   ```
   AGENTS.md            ← bloque DC Skills: protocolo + tabla de skills (cualquier agente)
   CLAUDE.md / GEMINI.md ← "@AGENTS.md" para que esos agentes lo carguen
   dc-skills.json       ← qué skills usa el proyecto (commitéalo)
   .claude/skills/<skill>/SKILL.md   ← Claude Code los carga como Agent Skills nativos
   .agents/skills/<skill>/SKILL.md   ← ruta para el resto de agentes
   ```
4. Abre tu agente y di "empecemos". Leerá AGENTS.md, ejecutará `dc-skills agent-start` y sabrá qué
   skills usar y qué hay en memoria.

### La "línea mágica" (proyecto vacío)
Si prefieres que el **agente** haga la selección conversando contigo, crea `AGENTS.md` con:
```md
Antes de cualquier cosa ejecuta `dc-skills agent-start` y sigue sus instrucciones.
```
El agente te preguntará qué vas a construir, te mostrará la recomendación del orquestador y,
cuando confirmes, instalará con `dc-skills add ... --yes`. (`dc-skills init` hace lo mismo y además
deja el bloque completo.)

## Comandos

```
dc-skills                       menú interactivo
dc-skills init                  prepara AGENTS.md + dc-skills.json sin skills
dc-skills agent-start           estado del proyecto para el agente (markdown)
dc-skills list | installed      catálogo | instalados
dc-skills recommend "desc"      recomendación del orquestador
dc-skills add <skills> -y       instala (con requisitos) · remove <skills> · update
dc-skills new <nombre>          crea un skill desde plantilla
dc-skills request <nombre> "x"  registra un skill que falta · requests
dc-skills mem add|search|list|forget   memoria compartida (--agent, --kind, --tags, --global)
dc-skills log "mensaje"         log de actividad
dc-skills serve --open          dashboard local (puerto 47821, --port para cambiar)
dc-skills mcp                   servidor MCP stdio
dc-skills doctor | self-update
```

## Memoria compartida entre agentes

Una sola base (`~/.dc-skills/memory.db`) para todos los proyectos y todos los agentes. Cada
registro guarda proyecto, agente, tipo (`decision`, `convention`, `bug`, `todo`, `note`) y fecha.
Las memorias con `--global` aplican a todos tus proyectos (preferencias personales).

**Por CLI** (funciona con cualquier agente que pueda ejecutar comandos; el protocolo está en
AGENTS.md): `dc-skills mem add "..." --agent gemini --kind decision`.

**Por MCP** (más natural para el agente):
```sh
# Claude Code (en Windows el comando necesita cmd /c)
claude mcp add dc-skills --scope user -- cmd /c dc-skills mcp      # Windows
claude mcp add dc-skills --scope user -- dc-skills mcp             # Linux/macOS
```
Gemini CLI (`~/.gemini/settings.json`), Codex (`~/.codex/config.toml`), Kimi, Cursor: registra un
servidor MCP stdio con comando `dc-skills` y argumento `mcp`. El nombre del agente se toma del
cliente MCP automáticamente.

La DB no se versiona en git (es tuya, local). Para compartir memoria con el equipo, el siguiente
paso natural es un servidor central; por ahora cada máquina tiene la suya.

## Crear y compartir skills

```sh
dc-skills new vue --title Vue --description "Vue 3 con Composition API..." --keywords vue,nuxt --npm vue --requires html,css
```
Luego completa `skills/vue/SKILL.md` (o pídeselo a tu agente: el skill `skill-creator` le explica el
formato), commit y push. En cada proyecto: `dc-skills self-update && dc-skills update`.

Cuando un agente detecta una tecnología sin skill, la registra con `dc-skills request`; las ves en
`dc-skills requests` y en el dashboard.

## Estructura del repo

```
bin/dc-skills.js      entrada del CLI
src/                  cli, detect (orquestador), install, memory (SQLite), server + dashboard.html, mcp
skills/<nombre>/      SKILL.md (instrucciones) + dc.json (detección y requisitos)
templates/skill/      plantilla de skill nuevo
test/                 npm test
```
