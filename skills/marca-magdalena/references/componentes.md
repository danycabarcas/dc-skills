# Componentes `mg-*` · Marca Magdalena

Inventario completo de `dist/css/magdalena.css` (fuente: `src/components.css` del kit). Requiere
`<body class="mg-base">`. **Si una clase no aparece aquí, no existe.**

## Inventario
| Bloque | Modificadores / elementos |
|---|---|
| Layout | `mg-container`, `mg-grid`, `mg-row`, `mg-stack` |
| Tipografía | `mg-h1`…`mg-h4`, `mg-eyebrow`, `mg-title-underline`, `mg-link`, `mg-text-{primary,cyan,green,red,yellow,gray,ink,muted}`, `mg-text-gradient`, `mg-text-gradient-sky` |
| `mg-navbar` | `--dark`, `--gradient`, `--stripe`, `__brand`; enlaces `mg-nav-link` |
| `mg-sidebar` | `__label` |
| `mg-hero` | `--brand`, `--light`, `--stripe` |
| `mg-card` | `--accent`, `--accent-{cyan,green,red,yellow}`, `--accent-top`, `--stripe-top`, `--stripe-bottom`, `--dark`, `--flat`, `--glass`, `--gradient`, `--hover`; `__header` (`--dark`, `--gradient`, `--sky`), `__body`, `__footer` |
| `mg-btn` | `--primary`, `--secondary`, `--accent`, `--cyan`, `--sky`, `--success`, `--danger`, `--dark`, `--outline`, `--ghost`, `--flat`, `--on-dark`, `--aa`, `--sm`, `--lg`, `--block`, `--pill`, `--square` |
| Formularios | `mg-label`, `mg-input`, `mg-select`, `mg-textarea`, `mg-check`, `mg-help`; estados `.is-invalid`, `.is-valid` |
| `mg-badge` | `--cyan`, `--green`, `--red`, `--yellow`, `--purple`, `--gray`, `--dark`, `--gradient`, `--solid`, `--dot` |
| `mg-alert` | `--info`, `--success`, `--warning`, `--danger`; `__title` |
| `mg-stat` (KPI) | `--sky`, `--aqua`, `--tropical`, `--sun`, `--heat`, `--deep`, `--solid`; `__icon`, `__value`, `__label`, `__delta` (`.is-down`) |
| Datos | `mg-table`, `mg-tabs` + `mg-tab`, `mg-breadcrumb`, `mg-chip`, `mg-progress`, `mg-avatar`, `mg-tag-date` |
| La línea | `mg-stripe` (`--thin`, `--thick`, `--xl`, `--v`, `--flow`, `--blue`), `mg-stripe-top`, `mg-stripe-bottom`, `mg-divider` (`--line`, `--stripe`) |
| Marco | `mg-frame` (`--sky`, `--stripe`, `--thick`) |
| Efectos | `mg-glass`, `mg-glass-dark`, `mg-shapes` (`--dark`), `mg-shadow-{sm,md,lg,glow}`, `mg-rounded`, `mg-rounded-lg`, `mg-rounded-pill` |
| Fondos | `mg-bg-app`, `mg-bg-surface`; degradados `mg-bg-{primary,primary-h,primary-v,sky,sky-h,aqua,mist,steel,action,night,deep,stripe,sun,heat,earth,tropical,violet}`; planos `mg-bg-flat-{primary,cyan,sky,navy,red,yellow,green,olive,purple}` |
| Piezas | `mg-footer`, `mg-logo-pill`, `mg-post`, `mg-id-card` (`__photo`, `__name`), `mg-business-card` (`__name`) |
| Accesibilidad | `mg-sr-only`, `mg-focusable` |

## Patrones

### Página institucional
```html
<body class="mg-base">
  <header class="mg-navbar mg-navbar--stripe">
    <a class="mg-navbar__brand" href="/">
      <img src="BASE/assets/logos/svg/logo-horizontal-color.svg" alt="Gobernación del Magdalena" height="40">
    </a>
    <nav><a class="mg-nav-link" href="/tramites">Trámites</a></nav>
  </header>

  <section class="mg-hero">
    <p class="mg-eyebrow">Servicios digitales</p>
    <h1>Haz tus trámites en línea</h1>
    <a class="mg-btn" href="/ingresar">Ingresar</a>
    <a class="mg-btn mg-btn--on-dark mg-btn--outline" href="/ayuda">Ayuda</a>
  </section>

  <main class="mg-container">…</main>

  <footer class="mg-footer">
    <hr class="mg-stripe">
    …
  </footer>
</body>
```

### Tablero (KPIs + tabla)
```html
<div class="mg-grid">
  <div class="mg-stat">
    <div class="mg-stat__icon">📄</div>
    <div><div class="mg-stat__value">1.284</div><div class="mg-stat__label">Solicitudes</div>
      <div class="mg-stat__delta">+12%</div></div>
  </div>
  <div class="mg-stat mg-stat--sun">…</div>
</div>

<div class="mg-card mg-card--accent-top">
  <div class="mg-card__header">Últimas solicitudes</div>
  <div class="mg-card__body"><table class="mg-table">…</table></div>
</div>
```

### Formulario
```html
<label class="mg-label" for="doc">Número de documento</label>
<input class="mg-input" id="doc" name="doc" inputmode="numeric" aria-describedby="doc-help" required>
<p class="mg-help" id="doc-help">Sin puntos ni espacios.</p>
<div class="mg-alert mg-alert--danger" role="alert"><strong class="mg-alert__title">Error</strong> El documento no es válido.</div>
<button class="mg-btn" type="submit">Consultar</button>
```

### Logo sobre foto o color
```html
<span class="mg-logo-pill"><img src="BASE/assets/logos/svg/logo-horizontal-color.svg" alt="Gobernación del Magdalena" height="36"></span>
```
