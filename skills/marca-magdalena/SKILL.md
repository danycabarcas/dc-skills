---
name: marca-magdalena
description: Identidad visual de la Gobernación del Magdalena 2026 para CUALQUIER software, lenguaje o pieza - paleta oficial, la línea multicolor, logos, tipografía, estilo sobrio institucional, accesibilidad y cómo aplicarla en cualquier tecnología (web, móvil, backend, reportes, documentos, correos, gráficos). Úsalo siempre que algo lleve la imagen de la Gobernación, sin importar el stack.
---

# Marca Gobernación del Magdalena

Este skill es **independiente de la tecnología**: las reglas de marca valen igual en Angular, Vue,
React, Node, Python, Java, PHP, móvil, un PDF o un correo. Lo específico de cada tecnología está en
`references/stacks/` (sección 7): lee **solo** el de tu proyecto.

Fuente oficial: kit **manual_de_marca** (https://github.com/danycabarcas/manual_de_marca), publicado en
**https://manualdemarca.magdalena.gov.co** (en adelante `BASE`). Todo lo consumible está en `BASE/dist/`
y `BASE/assets/`. **No inventes colores, logos ni variantes**: usa los archivos del kit.

## 1. Reglas de estilo (lo más importante)
- **Sobrio e institucional**: superficies blancas, azul-noche (`navy`) y gris azulado. **Un solo color
  dominante: el azul institucional `#0071BB`.**
- Proporción orientativa por pantalla o pieza: **70% neutros · 15% azul-noche · 10% azul · 5% acentos**.
- Rojo, amarillo y verde solo para **estados** (error, aviso, éxito), en tonos suaves (escalas 50-200 de
  fondo, 700-800 de texto).
- **La línea multicolor** (9 franjas: violeta · ocre · amarillo · rojo · azul · cian · celeste · verde ·
  violeta) es la firma de la marca: **fina (≈3 px en pantalla)**, en encabezado, pie o portada. No la
  uses como fondo de bloques ni la engroses como decoración.
- Degradados azules (`#0071BB → #00B7D9`, y hasta `#9FD7E5`) solo para portadas/hero y piezas de
  campaña; no en cada tarjeta.
- Tipografía **Montserrat** (sustituto libre de Gotham, que es comercial). Títulos 700-900, texto
  400-500. Fallback: `'Segoe UI', system-ui, Arial, sans-serif`.
- Esquinas: radios `4 · 8 · 12 · 16 px` y píldora. Sombras suaves con tinte azul-noche.

## 2. Paleta oficial (manual, página 05)
| Nombre | HEX | RGB | Rol | Texto encima |
|---|---|---|---|---|
| primary | `#0071BB` | 0, 113, 187 | Azul institucional (primario) | blanco (5.2:1) |
| cyan | `#00B7D9` | 0, 183, 217 | Cian, fin del degradado / info | oscuro `#1D1D1B` |
| sky | `#9FD7E5` | 159, 215, 229 | Celeste, fondos suaves | oscuro |
| red | `#F7003C` | 247, 0, 60 | Alertas / peligro | blanco |
| yellow | `#FEC800` | 254, 200, 0 | Acento / aviso | oscuro |
| green | `#69B75E` | 105, 183, 94 | Acento / éxito | oscuro |
| olive | `#A28034` | 162, 128, 52 | Ocre, acento | blanco |
| purple | `#5618BA` | 86, 24, 186 | Violeta, extremos de la línea | blanco |

Neutros: tinta `#1D1D1B`, gris `#606060`, superficie `#F6F5F5`, blanco `#FFFFFF`.
Valores CMYK (impresión), escalas 50-950, gris azulado de interfaz, azul-noche, degradados, sombras
y nombres de variables: [references/tokens.md](references/tokens.md).

Mapeo semántico estándar (úsalo en cualquier librería de UI): **primary** `#0071BB` · **info**
`#00B7D9` · **success** `#69B75E` · **warning** `#FEC800` · **danger** `#F7003C` · **secondary** `#606060`.

## 3. Logos
Archivos en `BASE/assets/logos/svg/` y `png/` (JPG con fondo blanco en `jpg/`):

| Uso | Archivo |
|---|---|
| Logo principal (preferente) | `logo-vertical-color` |
| Cabeceras, firmas de correo, espacios anchos | `logo-horizontal-color` |
| Fondos oscuros / azules / menú lateral | `logo-horizontal-blanco` |
| Documentos monocromos | `logo-horizontal-gris`, `logo-horizontal-negro` |
| Íconos pequeños (favicon, avatar, app) | escudo solo: `png/escudo.png`; favicons en `BASE/assets/favicon/` |
| La línea como imagen | `barra-franjas.svg` (escala a cualquier ancho) |

- ✅ SVG en pantalla siempre que se pueda; PNG para correos y apps que no lean SVG; JPG solo con fondo
  blanco. Fija **solo** el alto (o solo el ancho) para no deformar.
- ✅ Espacio libre alrededor: al menos la altura de la «M» de MAGDALENA.
- ✅ Sobre fotos o colores: logo dentro de una cápsula blanca, o versión negativa (blanca).
- ❌ No recolorear, ni sombras, ni efectos. Solo versiones oficiales (color, gris, negro, negativo).
- ❌ **No poner el logo a color sobre el degradado azul** → versión blanca o cápsula blanca.
- ❌ No separar escudo y texto, salvo en íconos pequeños.
- Texto alternativo: "Gobernación del Magdalena".
- `marca-magdalena-te-lo-puedes-creer` es marca territorial/turística, **no** institucional: úsala solo
  si el proyecto lo pide.

## 4. Accesibilidad
- Contraste AA: blanco sobre azul `#0071BB`, rojo, violeta y ocre; texto oscuro `#1D1D1B` sobre cian,
  celeste, amarillo y verde. Nunca texto blanco sobre amarillo o celeste.
- No comuniques solo con color (estados con ícono o texto); foco visible con el azul o el cian.

## 5. Gráficos y datos
- Serie principal en azul `#0071BB`; comparaciones en grises; acentos solo para resaltar.
- Secuenciales con la escala `primary` 100→900; estados con verde/amarillo/rojo de la paleta.
- Categóricos (si de verdad hacen falta varios): azul, cian, verde, ocre, violeta, gris; máximo 6.
- Más reglas de visualización: skill `dashboards` (si está instalado).

## 6. Cómo aplicarla en cualquier proyecto
1. **Elige de dónde tomar la marca**:
   - **Por URL** (`BASE/dist/...`): lo más simple; necesita internet.
   - **Copiada al proyecto** (`dist/` + `assets/logos/` del kit): para intranet o sin internet; aloja
     también Montserrat localmente. Kit completo: `BASE/dist/downloads/kit-desarrollo-css-y-temas.zip`
     y `logos-svg.zip`.
   - Versión fija y estable por URL: `https://cdn.jsdelivr.net/gh/danycabarcas/manual_de_marca@<tag>/dist/...`.
2. **Elige el formato según la tecnología** (no hace falta ninguna librería en particular):
   - **CSS listo**: `dist/css/magdalena.min.css` (variables + componentes `mg-*`, ver
     [references/componentes.md](references/componentes.md)) o solo variables `magdalena-tokens.min.css`.
   - **Tokens** para cualquier lenguaje: `dist/tokens/magdalena-tokens.json` (y `.mjs`, `.cjs`, `.d.ts`),
     `dist/scss/`, `dist/less/`, Android XML, Flutter.
   - **Temas para librerías**: Tailwind, Bootstrap, AdminLTE, Angular Material, PrimeNG/PrimeVue, MUI,
     Vuetify (ver tabla).
3. **Aplica las reglas 1-5** sin importar cómo se cargó la marca.

## 7. Guía por tecnología
Lee solo la que corresponda:

| Tecnología | Guía |
|---|---|
| HTML/CSS puro, plantillas de cualquier backend (Express/EJS, Django/Jinja, Thymeleaf, Razor, Blade...) | [stacks/web-css.md](references/stacks/web-css.md) |
| Tailwind CSS (v3/v4) | [stacks/tailwind.md](references/stacks/tailwind.md) |
| Angular (general, Angular Material, PrimeNG) | [stacks/angular.md](references/stacks/angular.md) |
| Vue / Nuxt (Vuetify, PrimeVue) | [stacks/vue.md](references/stacks/vue.md) |
| React / Next.js (MUI) | [stacks/react.md](references/stacks/react.md) |
| Node.js (servidores, bundlers, correos, PDFs) | [stacks/node.md](references/stacks/node.md) |
| Python (Django, Flask, FastAPI, gráficos, reportes) | [stacks/python.md](references/stacks/python.md) |
| Java, .NET, WordPress | [stacks/java-dotnet-wordpress.md](references/stacks/java-dotnet-wordpress.md) |
| Bootstrap 4/5 y AdminLTE 3/4 | [stacks/bootstrap-adminlte.md](references/stacks/bootstrap-adminlte.md) |
| Laravel / Filament | [stacks/laravel-filament.md](references/stacks/laravel-filament.md) |
| Móvil (Android, Flutter, iOS) | [stacks/movil.md](references/stacks/movil.md) |
| Documentos, presentaciones, correos e impresos | [stacks/documentos.md](references/stacks/documentos.md) |
| Otra tecnología | usa los tokens JSON/CSS y las reglas 1-5; si la librería de UI tiene "tema", mapea primary/info/success/warning/danger con el mapeo semántico de la sección 2 |

## 8. Qué es oficial y qué no
- **Del manual (oficial):** paleta de 8 colores, logotipos, versiones, la línea, escudo, bandera,
  aplicaciones impresas.
- **Decisiones del equipo de desarrollo (validar con Comunicaciones):** escalas 50-950, degradados,
  componentes `mg-*`, mapeo semántico, tamaños de logo y espacio libre.
Si el usuario pide algo que contradice el manual (otro color primario, logo recoloreado), avísale.

## Verificación
- [ ] Domina el azul institucional; acentos ≤ 5% y solo con significado.
- [ ] La línea aparece como firma fina, no como decoración pesada.
- [ ] Logo oficial correcto para el fondo, sin deformar, con texto alternativo.
- [ ] Contraste AA según la sección 4.
- [ ] Montserrat cargada (o alojada localmente en intranet/apps).
