# Web con HTML/CSS (cualquier backend o plantilla)

Funciona igual en HTML estático, Express/EJS/Handlebars/Pug, Django/Jinja, Flask, Thymeleaf, Razor,
Blade, etc.: los archivos de la marca son CSS y SVG estáticos.

## Cargar la marca
```html
<!-- Todo en uno: variables + degradados + la línea + componentes mg-* (incluye Montserrat) -->
<link rel="stylesheet" href="https://manualdemarca.magdalena.gov.co/dist/css/magdalena.min.css">
<!-- o solo variables, si ya tienes tus propios componentes -->
<link rel="stylesheet" href="https://manualdemarca.magdalena.gov.co/dist/css/magdalena-tokens.min.css">
```
Sin internet: copia `dist/css/` y `assets/logos/` del kit a la carpeta de estáticos del proyecto y
enlázalos con la ruta local; aloja Montserrat localmente.

## Estructura base
```html
<body class="mg-base">
  <header class="mg-navbar mg-navbar--stripe">
    <a class="mg-navbar__brand" href="/">
      <img src="/brand/logos/svg/logo-horizontal-color.svg" alt="Gobernación del Magdalena" height="40">
    </a>
  </header>
  <main class="mg-container">…</main>
  <footer class="mg-footer"><hr class="mg-stripe">…</footer>
</body>
```
Componentes disponibles (`mg-card`, `mg-btn`, `mg-stat`, `mg-table`, `mg-alert`...):
[../componentes.md](../componentes.md).

## Usar las variables en tu propio CSS
```css
.mi-banner { background: var(--mg-gradient-sky); color: #fff; border-radius: var(--mg-radius-lg); }
.mi-boton  { background: var(--mg-gradient-action); color: #fff; }
.mi-titulo { color: var(--mg-primary-700); font-family: var(--mg-font-display); }
.mi-linea  { height: 3px; background: var(--mg-gradient-stripe); }
```
Con Sass/Less: `dist/scss/_magdalena-tokens.scss` / `dist/less/magdalena-tokens.less`.
