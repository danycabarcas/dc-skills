# Bootstrap 4/5 y AdminLTE 3/4 (cualquier backend)

Carga siempre el CSS de la marca **después** del de Bootstrap/AdminLTE.

## Bootstrap
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://manualdemarca.magdalena.gov.co/dist/bootstrap/magdalena-bootstrap5.min.css" rel="stylesheet">
```
Bootstrap 4: `magdalena-bootstrap4.min.css`. Si compilas Bootstrap con Sass, importa
`_magdalena-bootstrap-variables.scss` (y `_magdalena-tokens.scss`) **antes** de Bootstrap.

## AdminLTE
- AdminLTE 4 (Bootstrap 5): `dist/adminlte/magdalena-adminlte4.min.css` después de `adminlte.min.css`.
  Sidebar con `data-bs-theme="dark"` y logo `logo-horizontal-blanco.svg` en `.brand-link`.
- AdminLTE 3 (Bootstrap 4, incluido `jeroennoten/laravel-adminlte`): `magdalena-adminlte3.min.css`;
  sidebar `sidebar-dark-primary`.
- Indicadores: `small-box text-bg-primary` / `text-bg-info` quedan blancos con filete de color.
