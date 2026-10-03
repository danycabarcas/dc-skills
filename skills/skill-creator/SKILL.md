---
name: skill-creator
description: Cómo crear o mejorar un skill del catálogo DC Skills (SKILL.md + dc.json) para una tecnología nueva. Úsalo cuando falte un skill o el usuario pida crear uno.
---

# Crear un skill DC

Un skill es una carpeta `skills/<nombre>/` con:

```
skills/vue/
├── SKILL.md        # instrucciones para el agente (formato Agent Skills estándar)
├── dc.json         # metadatos para el orquestador de dc-skills (detección, requisitos)
└── references/     # opcional: docs largas que el agente lee solo si las necesita
```

## Paso a paso
1. `dc-skills new <nombre> --title "Vue" --description "..." --keywords vue,nuxt --npm vue --requires html,css`
   (crea la carpeta desde la plantilla; en el repo de dc-skills queda lista para commit).
2. Completa `SKILL.md` con las secciones de abajo.
3. Ajusta `dc.json` para que el orquestador lo detecte.
4. Pruébalo: `dc-skills list`, y en un proyecto real `dc-skills recommend "..."`.
5. Commit en el repo dc-skills: `feat(skills): add vue skill`.

## SKILL.md
Frontmatter obligatorio (solo `key: value` en una línea):
```yaml
---
name: vue                     # igual al nombre de la carpeta, minúsculas y guiones
description: Convenciones de Vue 3 (Composition API, <script setup>, Pinia). Úsalo al crear o modificar componentes .vue.
---
```
La `description` es lo que el agente lee para decidir si cargar el skill: di **qué cubre** y
**cuándo usarlo**, en una o dos frases.

Cuerpo recomendado (conciso: idealmente < 250 líneas; lo extenso va a `references/`):
1. **Antes de empezar** – detectar versión real y herramientas del proyecto.
2. **Estructura y convenciones** – carpetas, nombres, dónde va cada cosa.
3. **Reglas** – ✅ haz / ❌ evita. Concretas y verificables, no consejos genéricos.
4. **Patrones de código** – ejemplos cortos y correctos de lo más común.
5. **Errores frecuentes** – lo que los agentes suelen hacer mal con esta tecnología.
6. **Verificación** – comandos para comprobar que el cambio funciona (test, lint, build).

Principios:
- Escribe para un agente competente: no expliques qué es la tecnología, di **cómo la usa
  este equipo** y qué errores evitar.
- Diferencia por versión cuando importe ("v4+: ...; si el proyecto está en v3: ...").
- Nada de APIs inventadas: si dudas de un detalle, no lo pongas.

## dc.json
```json
{
  "title": "Vue",
  "category": "frontend",
  "requires": ["html", "css"],
  "detect": {
    "files": ["*.vue", "vite.config.ts"],
    "npm": ["vue", "nuxt"],
    "composer": [],
    "keywords": ["vue", "vuejs", "nuxt", "pinia"]
  }
}
```
- `category`: `meta | language | framework | frontend | styles | brand | other` (`brand` = identidad visual de un cliente).
- `requires`: skills que se instalan junto con este (filament → laravel → php).
- `detect.files`: archivos marcadores o extensiones (`*.vue`). +10 puntos.
- `detect.npm` / `detect.composer`: dependencias; admite prefijo `@nestjs/*`. +15 puntos.
- `detect.keywords`: palabras que el usuario usaría al describir el proyecto. +10 puntos.
- `always: true` solo para skills base como `dc-core`.

## Mejorar un skill existente
- Si un agente cometió un error que el skill debió prevenir, agrega la regla en "Errores
  frecuentes" con el ejemplo correcto.
- Mantén el skill corto: si una sección crece mucho, muévela a `references/<tema>.md` y
  enlázala desde SKILL.md ("para X lee references/x.md").
- Tras editar, en cada proyecto: `dc-skills update`.
