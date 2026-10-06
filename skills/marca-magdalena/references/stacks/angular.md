# Angular (general, Angular Material, PrimeNG)

## Sin librería de componentes
`angular.json` → `"styles": ["src/styles/magdalena.css", "src/styles.scss"]` (copiado de
`dist/css/magdalena.css`), o por URL en `src/index.html`. Usa las clases `mg-*` o las variables `--mg-*`.

Tokens en TypeScript: `import tokens from './magdalena-tokens.json'` (activa `resolveJsonModule`) →
`tokens.colors.primary.hex`.

## Angular Material
Copia `dist/angular-material/_magdalena-theme.scss` (y opcionalmente `magdalena-material-extras.css` y
`dist/css/magdalena-tokens.css`) a `src/styles/`.
```scss
// styles.scss — Material 3 (Angular Material 19+)
@use '@angular/material' as mat;
@use './styles/magdalena-theme' as mg;

html { @include mg.magdalena-m3(); }          // define --mat-sys-* con la marca
@import './styles/magdalena-tokens.css';
body { font-family: var(--mg-font-sans); margin: 0; }
```
```scss
// Material 2 (Angular Material 15-18)
@use '@angular/material' as mat;
@use './styles/magdalena-theme' as mg;

@include mat.core();
@include mg.magdalena-m2();
```
Clases extra del kit: `mg-toolbar-gradient`, `mg-toolbar-stripe`, `mg-btn-gradient`, `mg-card-stripe`,
`mg-sidenav-deep`. Carga Montserrat en `index.html`.

## PrimeNG
Preset `dist/primeng/magdalena-preset.ts`:
```ts
providePrimeNG({ theme: { preset: MagdalenaPreset, options: { darkModeSelector: false } } })
```
Dentro del preset, el import es `@primeuix/themes` (PrimeNG 20+) o `@primeng/themes` (18/19).
PrimeNG ≤ 17: carga su tema clásico y después `dist/primeng/magdalena-primeng.min.css`.

⚠ **PrimeNG 22+ es comercial con clave de licencia**; sin licencia usa ≤ 21 (ver skill `primeng`).
