---
name: skill-creator
description: Criterio y método para que el agente cree, mejore, reorganice o importe skills de DC Skills - decide si hace falta un skill, de qué tipo, en qué catálogo (público, interno, local o del proyecto), cómo estructurarlo y cómo probarlo. Úsalo cuando falte un skill, uno se quede corto, haya skills que se pisan, o el usuario pida crear uno.
---

# Crear y organizar skills

Tienes autonomía para **decidir** cómo crear y organizar skills: tipo, estructura, nombre y
alcance. Lo que **no** decides solo es publicar en un catálogo compartido (público o interno): ahí
propones y el usuario aprueba.

## 1. ¿Hace falta un skill?
| Situación | Qué hacer |
|---|---|
| Un dato o decisión puntual ("usamos PostgreSQL") | memoria: `dc-skills mem add ... --kind decision` |
| Convención que solo aplica a este proyecto y cabe en 3-5 líneas | sección propia en el `AGENTS.md` del proyecto (fuera del bloque dc-skills) |
| Instrucciones que se repiten en varios proyectos, errores que el agente comete más de una vez, estándar del equipo, una tecnología o flujo sin cubrir | **skill** |
| Ya existe un skill que casi lo cubre | **mejora ese skill**, no crees otro |

Antes de crear: `dc-skills list` y `dc-skills catalog` para ver lo que existe (incluidos los importados).
Dos skills que se activan con lo mismo confunden al agente: evita solapes.

## 2. Tipo y nombre
| Tipo | Ejemplos de nombre | Contenido |
|---|---|---|
| Tecnología | `vue`, `laravel-livewire`, `postgres` | convenciones, versiones, patrones, errores frecuentes |
| Tarea / flujo | `crear-crud-filament`, `revision-seguridad`, `entrega-cliente` | pasos numerados con verificación en cada paso |
| Marca / cliente | `marca-<cliente>` | identidad visual, tono, reglas del cliente |
| Meta | `dc-core`, `skill-creator` | cómo trabajar con agentes y skills |

Nombre: minúsculas con guiones, específico (`laravel-colas` mejor que `colas`), estable (los
proyectos lo referencian). Tareas: verbo + objeto.

## 3. ¿Dónde vive? (`--scope`)
| Scope | Para qué | Quién lo ve |
|---|---|---|
| `publico` | conocimiento genérico y compartible | todo el mundo (repo público dc-skills) |
| `interno` (u otro catálogo privado) | herramientas, proveedores y procesos internos; clientes confidenciales | solo el equipo (repo privado) |
| `local` | experimentos y preferencias personales | solo esta máquina |
| `proyecto` | reglas que solo sirven en este proyecto | quien tenga el proyecto |

**Nunca en `publico`:** nombres de herramientas o proveedores de uso interno, datos o URLs de
clientes, credenciales, rutas de servidores, nada que el usuario haya marcado como interno. Ante la
duda, `interno` y pregunta. Antes de commit en el repo público corre `dc-skills guard`.

Los catálogos disponibles en esta máquina: `dc-skills catalog`.

## 4. Crear
```bash
dc-skills new <nombre> --scope <publico|interno|local|proyecto> \
  --title "Título" --description "Qué cubre. Úsalo cuando ..." \
  --keywords a,b,c --category framework --requires php,laravel --composer vendor/paquete --npm paquete
```
Luego completa `SKILL.md` (sección 5) y ajusta `dc.json` (sección 7).

## 5. Estructura: carga progresiva
```
<nombre>/
├── SKILL.md          núcleo: lo que se necesita casi siempre (ideal < 250 líneas)
├── references/       detalle que solo a veces hace falta (uno por tema o variante)
├── scripts/          operaciones deterministas que el agente ejecuta en vez de reescribir
├── assets/           plantillas, ejemplos, archivos a copiar
└── dc.json           detección para el orquestador
```
Decide la estructura con estas reglas:
- Si una sección solo aplica en algunos casos (un framework, una versión, un tipo de proyecto) →
  `references/<tema>.md`, enlazado desde SKILL.md diciendo **cuándo** leerlo.
- Si un procedimiento es mecánico y repetible (generar, validar, convertir) → `scripts/` y que el
  skill diga cómo ejecutarlo.
- Si el SKILL.md supera ~250 líneas, divide; si dos skills comparten la mitad del contenido, fusiona.

### SKILL.md
Frontmatter obligatorio (`key: value` en una línea):
```yaml
---
name: <igual a la carpeta>
description: <qué cubre> + <cuándo usarlo>. Incluye las palabras que diría el usuario.
---
```
La `description` decide cuándo se activa el skill: concreta, sin "SIEMPRE/MUST" salvo que de verdad
aplique a toda tarea (solo `dc-core`).

Cuerpo recomendado: **Antes de empezar** (detectar versión/herramientas) → **Estructura y
convenciones** → **Reglas** (✅/❌ concretas y verificables) → **Patrones** (ejemplos cortos y
correctos) → **Errores frecuentes de agentes** → **Verificación** (comandos).

### Calidad
- Escribe para un agente competente: no expliques qué es la tecnología; di cómo la usa el equipo y
  qué errores evitar.
- **Verifica antes de escribir**: versiones y APIs contra la fuente real (`npm view`, PyPI,
  documentación oficial, el código en `vendor/`/`node_modules/`). Si no puedes verificar un detalle,
  no lo pongas o márcalo como "verificar".
- Diferencia por versión cuando la API cambie (tabla de versiones).
- Ejemplos que compilen; nada de `...` en partes críticas.

## 6. Probar
1. `dc-skills list` muestra el skill y su descripción se entiende sola.
2. `dc-skills recommend "<2-3 descripciones realistas>"` lo recomienda cuando debe y no cuando no.
3. Piensa 3 pedidos reales del usuario y comprueba que, siguiendo el skill, el resultado sería
   correcto. Si un pedido falla, el skill está incompleto.
4. En el repo dc-skills: `npm test` (valida nombre, descripción y `requires`).

## 7. dc.json
```json
{
  "title": "Vue",
  "category": "frontend",
  "requires": ["html", "css"],
  "detect": {
    "files": ["*.vue", "nuxt.config.ts"],
    "npm": ["vue", "nuxt"],
    "composer": [],
    "keywords": ["vue", "vuejs", "nuxt", "pinia"]
  }
}
```
- `category`: `meta | language | framework | frontend | styles | brand | other`.
- `requires`: skills que se instalan junto con este.
- Puntaje del orquestador: dependencia (`npm`/`composer`, admite `prefijo/*`) +15, archivo o
  extensión (`files`) +10, palabra en la descripción del usuario (`keywords`) +10.
- `"private": true` marca un skill como privado aunque esté en otro catálogo.

## 8. Mejorar y reorganizar
- **Un error que el skill debió prevenir** → agrega la regla en "Errores frecuentes" con el ejemplo
  correcto. Es la mejora más valiosa.
- **Solapes** → propone al usuario fusionar o dividir con una tabla antes/después; luego hazlo.
- **Renombrar** rompe proyectos que lo usan: crea el nuevo y deja el viejo con descripción
  `OBSOLETO: usa <nuevo>` hasta que los proyectos actualicen.
- Tras cambiar skills: `dc-skills update` en cada proyecto.

## 9. Skills de terceros
- Antes de escribir uno desde cero, busca si existe uno bueno con licencia permisiva y propón
  importarlo: `dc-skills import <owner/repo> --list`, luego `dc-skills import <owner/repo> <skill>`.
- El importador conserva LICENSE y créditos; no los borres. Si adaptas un skill importado, anota el
  cambio en su `CREDITS.md` (sección "Cambios"). Para cambios grandes, mejor un skill propio que lo
  complemente.
