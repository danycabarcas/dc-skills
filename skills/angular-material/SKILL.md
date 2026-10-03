---
name: angular-material
description: Angular Material y CDK (15-22, licencia MIT) - temas Material 3 con mat.theme y tokens --mat-sys-*, personalización con overrides, formularios, tablas con paginación/orden del servidor, diálogos, fechas y textos en español. Úsalo al crear o modificar pantallas con componentes mat-*.
---

# Angular Material

Aplica también el skill `angular`. Si el proyecto es de la Gobernación del Magdalena, el tema sale del
kit de marca (skill `marca-magdalena`, `dist/angular-material/_magdalena-theme.scss`).

## Antes de empezar: detecta versión y sistema de diseño
`package.json` → `@angular/material`.

| | 15 / 16 | 17 / 18 | 19+ |
|---|---|---|---|
| Sistema | Material 2 | M2 por defecto; M3 con `mat.define-theme` | **Material 3** |
| Tema | `mat.define-light-theme` + `mat.all-component-themes` | igual / `mat.define-theme` | `@include mat.theme((color, typography, density))` |
| Personalizar | mixins de color por componente | igual | `mat.<componente>-overrides((...))` y tokens `--mat-sys-*` |

- 20+: además de `mat-flat-button`, `mat-stroked-button`... existe `matButton="filled|outlined|tonal|elevated|text"`.
  Sigue la forma que ya use el proyecto.
- En M3 el input `color="primary|accent|warn"` no cambia colores (salvo configuración de
  compatibilidad): personaliza con overrides.
- Instalación/esquemas: `ng add @angular/material`; paletas propias:
  `ng generate @angular/material:theme-color`.

## Tema (M3, 19+)
```scss
// styles.scss
@use '@angular/material' as mat;

html {
  color-scheme: light;                       // 'light dark' si hay modo oscuro
  @include mat.theme((
    color: (primary: mat.$azure-palette, tertiary: mat.$blue-palette),
    typography: Montserrat,                  // o la fuente del proyecto (cargada en index.html)
    density: 0,
  ));
}

body { margin: 0; font: var(--mat-sys-body-medium); background: var(--mat-sys-surface); color: var(--mat-sys-on-surface); }
```
- En estilos propios usa los **tokens del sistema**: `var(--mat-sys-primary)`, `--mat-sys-on-primary`,
  `--mat-sys-surface-container`, `--mat-sys-outline-variant`, `--mat-sys-corner-medium`,
  `--mat-sys-title-large`... Así respetas el tema y el modo oscuro.
- Ajustes por componente con overrides, en el selector donde aplican:
  ```scss
  .acciones { @include mat.button-overrides((filled-container-shape: 8px)); }
  ```
- ❌ No estilices clases internas (`.mdc-*`, `.mat-mdc-*`) ni uses `::ng-deep`: se rompen al actualizar.
- Densidad `-1`/`-2` para pantallas administrativas con muchas filas o campos.

## Configuración de la app
```ts
// app.config.ts
providers: [
  // provideAnimationsAsync() solo en versiones ≤ 19; desde 20 Material no depende de @angular/animations
  provideNativeDateAdapter(),                       // o provideDateFnsAdapter() / provideLuxonDateAdapter()
  { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  { provide: MatPaginatorIntl, useClass: PaginadorEs },
  { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } },
]
```
```ts
@Injectable()
export class PaginadorEs extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Registros por página';
  override nextPageLabel = 'Siguiente';
  override previousPageLabel = 'Anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (page: number, size: number, length: number) =>
    length === 0 ? '0 de 0' : `${page * size + 1} – ${Math.min((page + 1) * size, length)} de ${length}`;
}
```
- Registra el locale de Angular (`registerLocaleData(localeEsCO)` + `LOCALE_ID`) para pipes de fecha/moneda.
- Íconos: Material Symbols (`<link>` a Google Fonts) y
  `inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined')`.

## Patrones
**Campo de formulario**
```html
<mat-form-field>
  <mat-label>Correo</mat-label>
  <input matInput type="email" formControlName="email" autocomplete="email">
  <mat-hint>Le enviaremos la confirmación.</mat-hint>
  @if (form.controls.email.hasError('email')) { <mat-error>Correo no válido.</mat-error> }
</mat-form-field>

<mat-form-field>
  <mat-label>Municipio</mat-label>
  <mat-select formControlName="municipioId">
    @for (m of municipios(); track m.id) { <mat-option [value]="m.id">{{ m.nombre }}</mat-option> }
  </mat-select>
</mat-form-field>
```

**Tabla con paginación y orden del servidor**
```html
<table mat-table [dataSource]="rows()" matSort (matSortChange)="sort.set($event)">
  <ng-container matColumnDef="nombre">
    <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
    <td mat-cell *matCellDef="let r">{{ r.nombre }}</td>
  </ng-container>
  <!-- más columnas -->
  <tr mat-header-row *matHeaderRowDef="columns"></tr>
  <tr mat-row *matRowDef="let r; columns: columns"></tr>
  <tr class="mat-row" *matNoDataRow><td class="mat-cell" [attr.colspan]="columns.length">Sin registros.</td></tr>
</table>
<mat-paginator [length]="total()" [pageSize]="20" [pageSizeOptions]="[20, 50, 100]" (page)="page.set($event)" />
```
- Pocos datos en memoria: `MatTableDataSource` + `paginator`/`sort` asignados tras la vista.
- Muchos datos: paginación y orden en el servidor (como arriba), recargando con los eventos.

**Diálogo**
```ts
private dialog = inject(MatDialog);

editar(registro: Registro) {
  this.dialog.open(EditarRegistroDialog, { data: registro, width: '32rem', maxWidth: '95vw' })
    .afterClosed().subscribe((ok) => ok && this.recargar());
}
// en el diálogo: data = inject(MAT_DIALOG_DATA); ref = inject(MatDialogRef);
```
Snackbar: `inject(MatSnackBar).open('Guardado', 'Cerrar', { duration: 3000 })`.

**CDK** (sin estilos Material): `Overlay`, `Dialog`, `DragDrop`, `ScrollingModule` (listas virtuales),
`A11yModule` (`cdkTrapFocus`, `LiveAnnouncer`), `BreakpointObserver`. Úsalo antes de instalar
librerías extra para esto.

## Errores frecuentes de agentes
- Mezclar API de tema M2 (`define-light-theme`, `palette`) con M3 (`mat.theme`).
- Esperar que `color="warn"` funcione en M3.
- `::ng-deep .mat-mdc-…` para cambiar estilos en vez de overrides/tokens.
- Importar módulos de todos los componentes en un archivo "shared" gigante: importa en cada componente.
- Paginador y fechas en inglés (faltan `MatPaginatorIntl` y `MAT_DATE_LOCALE`).
- Olvidar el date adapter → error "No provider found for DateAdapter".

## Verificación
- `ng build`; prueba navegación con teclado (select, datepicker, diálogo atrapa el foco y cierra con
  Escape), textos en español, contraste y modo oscuro si aplica.
