---
name: marca-magdalena
description: Identidad visual de la Gobernación del Magdalena 2026 - paleta, la línea multicolor, logos, tipografía, estilo sobrio institucional y cómo aplicarla en HTML, Tailwind, Laravel/Filament, AdminLTE, Bootstrap, Angular, React y Vue. Úsalo en cualquier interfaz, documento o pieza de la Gobernación.
---

# Marca Gobernación del Magdalena

Fuente oficial: kit **manual_de_marca** (https://github.com/danycabarcas/manual_de_marca), publicado en
**https://manualdemarca.magdalena.gov.co** (en adelante `BASE`). Todo lo consumible está en `BASE/dist/` y
`BASE/assets/`. **No inventes colores, logos ni variantes**: usa los archivos del kit.

## 1. Reglas de estilo (lo más importante)
- **Sobrio y corporativo**: superficies blancas, azul-noche (`navy`) y gris azulado. **Un solo color
  dominante: el azul institucional `#0071BB`.**
- Proporción orientativa por pantalla: **70% neutros · 15% azul-noche · 10% azul · 5% acentos**.
- Rojo, amarillo y verde solo para **estados** (error, aviso, éxito), en tonos suaves (escalas 50-200
  de fondo, 700-800 de texto).
- **La línea multicolor** (9 franjas: violeta · ocre · amarillo · rojo · azul · cian · celeste · verde ·
  violeta) es la firma de la marca: **fina, de 3 px**, en pie de página, bajo la cabecera o en portadas.
  No la uses como fondo de bloques ni la engroses como decoración.
- Degradados azules (`--mg-gradient-primary`, `--mg-gradient-sky`) solo para portadas/hero y
  micrositios de campaña; no en cada tarjeta.
- Tipografía **Montserrat** (sustituto web de Gotham, que es comercial). Ya viene importada en
  `magdalena.css`. Títulos 700-900, texto 400-500.
- Esquinas: radios de marca `sm 4px · md 8px · lg 12px · xl 16px · pill`. Sombras suaves con tinte
  azul-noche (`--mg-shadow-sm|md|lg`); foco con `--mg-shadow-glow`.

## 2. Paleta (manual, página 05)
| Token | HEX | Rol | Texto encima |
|---|---|---|---|
| `--mg-primary` | `#0071BB` | Azul institucional (primario) | blanco (5.2:1) |
| `--mg-cyan` | `#00B7D9` | Cian, fin del degradado / info | oscuro `#1D1D1B` |
| `--mg-sky` | `#9FD7E5` | Celeste, fondos suaves | oscuro |
| `--mg-red` | `#F7003C` | Rojo, alertas / peligro | blanco |
| `--mg-yellow` | `#FEC800` | Acento / aviso | oscuro |
| `--mg-green` | `#69B75E` | Acento / éxito | oscuro |
| `--mg-olive` | `#A28034` | Ocre, acento | blanco |
| `--mg-purple` | `#5618BA` | Violeta, extremos de la línea | blanco |

Neutros: tinta `#1D1D1B`, gris `#606060`, superficie `#F6F5F5`. Cada color tiene escala
`--mg-<color>-50 … -950`; además `--mg-gray-*` (gris azulado de UI) y `--mg-navy-600…950`.
Escalas completas, degradados, sombras y variables semánticas en
[references/tokens.md](references/tokens.md).

## 3. Logos
Archivos en `BASE/assets/logos/svg/` (y `png/`):

| Uso | Archivo |
|---|---|
| Logo principal (preferente) | `logo-vertical-color.svg` |
| Cabeceras, correos, espacios anchos | `logo-horizontal-color.svg` |
| Fondos oscuros / azules / sidebar | `logo-horizontal-blanco.svg` |
| Documentos monocromos | `logo-horizontal-gris.svg`, `logo-horizontal-negro.svg` |
| Íconos pequeños (favicon, avatar) | escudo solo: `png/escudo.png`; favicons en `BASE/assets/favicon/` |
| La línea como imagen | `barra-franjas.svg` (escala a cualquier ancho) |

- ✅ SVG siempre que se pueda. Fija **solo** `height` (o solo `width`) para no deformar.
- ✅ Espacio libre alrededor: al menos la altura de la «M» de MAGDALENA.
- ✅ Sobre fotos o fondos de color: logo dentro de la cápsula blanca `.mg-logo-pill`, o versión negativa.
- ❌ No recolorear, ni sombras, ni efectos. Solo versiones oficiales (color, gris, negro, negativo).
- ❌ **No poner el logo a color sobre el degradado azul** → versión blanca o cápsula.
- ❌ No separar escudo y texto, salvo en íconos pequeños.
- `alt="Gobernación del Magdalena"` siempre.
- `marca-magdalena-te-lo-puedes-creer` es marca territorial/turística, **no** institucional: úsala solo
  si el proyecto lo pide.

## 4. Cómo integrarla según el stack
Antes de copiar archivos, decide con el usuario: **por URL** (`BASE/dist/...`, más simple, necesita
internet) o **copiado al proyecto** (intranet/sin internet; aloja también Montserrat). Para producción
estable con URL, puede fijarse versión vía jsDelivr: `https://cdn.jsdelivr.net/gh/danycabarcas/manual_de_marca@<tag>/dist/...`.

| Stack | Qué usar |
|---|---|
| HTML / PHP / cualquier backend | `dist/css/magdalena.min.css` + `<body class="mg-base">` + clases `mg-*` |
| Solo variables (tienes tus componentes) | `dist/css/magdalena-tokens.min.css` |
| Tailwind v4 | `@import "tailwindcss"; @import "./magdalena.tailwind-v4.css";` |
| Tailwind v3 | `presets: [require('./magdalena.tailwind.preset.cjs')]` |
| Laravel (Blade/Vite) | copiar a `public/brand/` o importar en `resources/css/app.css` |
| Filament | colores del panel + logo (ver abajo) |
| AdminLTE 4 / 3 | `dist/adminlte/magdalena-adminlte4.min.css` (o `adminlte3`) **después** del CSS de AdminLTE |
| Bootstrap 5 / 4 | `dist/bootstrap/magdalena-bootstrap5.min.css` (o `bootstrap4`) o `_magdalena-bootstrap-variables.scss` |
| Angular Material | `dist/angular-material/_magdalena-theme.scss` (M3 v19+, M2 v15-18) |
| PrimeNG 18+ / PrimeVue 4 | `dist/primeng/magdalena-preset.ts` (⚠ PrimeNG 22+ es comercial con clave; sin licencia usar ≤ 21) |
| React / Next.js | `magdalena.min.css` global (layout raíz) o MUI `dist/mui/magdalena-mui-theme.mjs` |
| Vue / Nuxt | CSS global, Vuetify `dist/vuetify/magdalena-vuetify.mjs` o PrimeVue |
| Tokens en JS/TS | `dist/tokens/magdalena-tokens.json` (también `.mjs`, `.cjs`, `.d.ts`) |
| Móvil | `dist/tokens/android-colors.xml`, `flutter_magdalena_colors.dart` |

Guía detallada de cada stack: `BASE` → «Integración», o `docs/<stack>.md` en el repo del kit.
Recetas para los stacks DAYTECHCO (Laravel, Filament, Tailwind) en
[references/integracion.md](references/integracion.md).

### Filament (resumen)
```php
use Filament\Support\Colors\Color;

->colors([
    'primary' => Color::hex('#0071BB'),
    'info'    => Color::hex('#00B7D9'),
    'success' => Color::hex('#69B75E'),
    'warning' => Color::hex('#FEC800'),
    'danger'  => Color::hex('#F7003C'),
    'gray'    => Color::Slate,
])
->font('Montserrat')
->brandName('Gobernación del Magdalena')
->brandLogo(asset('brand/logos/svg/logo-horizontal-color.svg'))
->darkModeBrandLogo(asset('brand/logos/svg/logo-horizontal-blanco.svg'))
->brandLogoHeight('2.5rem')
->favicon(asset('brand/favicon/favicon.ico'))
```

## 5. Componentes `mg-*` (con `magdalena.css`)
Base `mg-base` · navegación `mg-navbar`, `mg-sidebar`, `mg-breadcrumb`, `mg-tabs` · portada `mg-hero`
(`--brand`, `--stripe`) · `mg-card` (`--accent-top`, `--stripe-top`, `--glass`, `--hover`) · botones
`mg-btn` (`--outline`, `--ghost`, `--secondary`, `--danger`, `--sm`, `--block`, `--on-dark`) · formularios
`mg-label`, `mg-input`, `mg-help` · datos `mg-table`, `mg-stat`, `mg-badge`, `mg-chip`, `mg-progress`,
`mg-alert` · la línea `mg-stripe` (`--thin`, `--v`, `--flow`) · `mg-footer`, `mg-glass`, `mg-logo-pill`.
Lista completa y ejemplos en [references/componentes.md](references/componentes.md). Si una clase no
está en esa lista, **no existe**: no la inventes.

## 6. Qué es oficial y qué no
- **Del manual (oficial):** paleta de 8 colores, logotipos, versiones, la línea, escudo, bandera,
  aplicaciones impresas.
- **Decisiones del equipo de desarrollo (validar con Comunicaciones):** escalas 50-950, degradados,
  componentes `mg-*`, mapeo semántico, tamaños de logo y espacio libre.
Si el usuario pide algo que contradice el manual (otro color primario, logo recoloreado), avísale.

## Verificación
- [ ] Domina el azul institucional; acentos ≤ 5% y solo con significado.
- [ ] La línea aparece como firma fina (cabecera o pie), no como decoración pesada.
- [ ] Logo oficial correcto para el fondo, sin deformar, con `alt`.
- [ ] Contraste AA: blanco sobre azul/rojo/violeta/ocre; texto oscuro sobre cian/celeste/amarillo/verde.
- [ ] Montserrat cargada (o alojada localmente en intranet).
