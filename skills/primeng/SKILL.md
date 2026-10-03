---
name: primeng
description: PrimeNG (17-22) para Angular - licencia (v22 es comercial), temas con presets y design tokens, componentes (Table, Select, DatePicker, Dialog, Toast...), formularios, tablas lazy con servidor, i18n en español, Tailwind y cambios entre versiones. Úsalo al crear o modificar pantallas con componentes p-*.
---

# PrimeNG

Aplica también el skill `angular`. Si el proyecto es de la Gobernación del Magdalena, el tema sale del
kit de marca (skill `marca-magdalena`, `dist/primeng/magdalena-preset.ts`).

## ⚠ Licencia: lee esto antes de instalar o actualizar
- **PrimeNG ≤ 21: MIT** (versiones community, sin sufijo `-lts`). Uso libre.
- **PrimeNG 22+ (julio 2026): licencia comercial "PrimeUI License"** con **clave obligatoria**
  (`providePrimeNG({ license: '…', … })`); sin clave muestra un aviso de licencia en la app.
  La licencia *Community* gratuita solo aplica a organizaciones con < 10 empleados, < 5
  desarrolladores y < USD 1M de ingresos. **Una entidad pública como la Gobernación no califica.**
- Por eso: **no instales ni actualices a PrimeNG 22+ sin que el usuario confirme que hay licencia.**
  Proyectos nuevos sin licencia → PrimeNG 21 (con Angular 21) o evaluar Angular Material (MIT).
  Fija la versión en package.json (`"primeng": "~21.1.0"`) para que nadie la suba por accidente.
- Nunca pongas la clave de licencia en el repositorio: va en el entorno/CI.

## Antes de empezar: la versión cambia todo
`package.json` → `primeng` (y `@angular/core`; PrimeNG sigue la versión mayor de Angular).

| | ≤ 17 | 18 / 19 | 20+ |
|---|---|---|---|
| Tema | CSS precompilado (`primeng/resources/themes/lara-light-blue/theme.css`) | presets con design tokens, paquete `@primeng/themes` | igual, paquete **`@primeuix/themes`** |
| Configuración | `PrimeNGConfig` | `providePrimeNG({ theme: { preset } })` desde `primeng/config` | igual (22+: además `license`) |
| Plantillas | `pTemplate="header"` | `<ng-template #header>` (pTemplate sigue funcionando) | `<ng-template #header>` |
| Animaciones | requiere `@angular/animations` | requiere `@angular/animations` | 20 lo requiere; **21+ no** (usa `@primeuix/motion`) |

Renombres de v18 (los nombres viejos están deprecados: **no los uses en código nuevo**):
`Dropdown → Select (p-select)`, `Calendar → DatePicker (p-datepicker)`, `InputSwitch → ToggleSwitch`,
`OverlayPanel → Popover`, `Sidebar → Drawer`, `TabView → Tabs (p-tabs, p-tablist, p-tab, p-tabpanels, p-tabpanel)`.

No mezcles el sistema de temas viejo (CSS de `primeng/resources`) con presets. Antes de usar un
componente o input, compruébalo en `node_modules/primeng/<componente>/` o en la doc de **esa** versión.

## Configuración (18+)
```ts
// app.config.ts
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';            // 18/19: '@primeng/themes/aura'
import es from 'primelocale/es.json';                 // traducciones (paquete primelocale)

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),                         // solo PrimeNG ≤ 20
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: '.app-dark', cssLayer: false } },
      translation: es.es,                             // meses, días, textos de filtros y paginador
      ripple: false,
    }),
  ],
};
```
- **Personaliza con `definePreset`**, no con CSS que pisa clases internas:
  ```ts
  const AppPreset = definePreset(Aura, { semantic: { primary: { 50: '{blue.50}', /* … */ 950: '{blue.950}' } } });
  ```
  Ajustes por componente: `components: { button: { … } }` en el preset, o el input `[dt]` en un
  componente concreto (18+).
- Íconos: `primeicons` (`@import "primeicons/primeicons.css";`, clases `pi pi-check`).
- Dark mode: `darkModeSelector` con una clase que el proyecto controle (o `false` si no hay modo oscuro).

## Tailwind con PrimeNG
- Plugin `tailwindcss-primeui` (utilidades con los tokens: `bg-primary`, `text-muted-color`, `bg-emphasis`).
- Tailwind v4: `@import "tailwindcss"; @plugin "tailwindcss-primeui";`
- Si las utilidades de Tailwind no ganan sobre los estilos de PrimeNG, activa `cssLayer` en
  `providePrimeNG` y define el orden de capas (`theme, base, primeng`) en vez de usar `!important`.
- Tailwind para **layout** (grid, espacios); PrimeNG para **componentes**. No reestilices
  componentes PrimeNG a punta de clases utilitarias.

## Componentes: patrones
Importa solo lo que usa cada componente standalone (`ButtonModule`, `TableModule`, `SelectModule`...).

**Formularios (Reactive Forms)**
```html
<form [formGroup]="form" (ngSubmit)="save()">
  <label for="municipio">Municipio</label>
  <p-select inputId="municipio" formControlName="municipioId" [options]="municipios()"
            optionLabel="nombre" optionValue="id" [filter]="true" placeholder="Seleccione" />
  @if (form.controls.municipioId.invalid && form.controls.municipioId.touched) {
    <small class="error" id="municipio-error">Seleccione un municipio.</small>
  }

  <label for="fecha">Fecha</label>
  <p-datepicker inputId="fecha" formControlName="fecha" dateFormat="dd/mm/yy" [showIcon]="true" />

  <p-button type="submit" label="Guardar" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid" />
</form>
```
- Usa `inputId` + `<label for>` (o `p-floatlabel`/`p-iftalabel`) para accesibilidad.
- `optionValue` para guardar el id; sin él el control guarda el objeto completo.

**Tabla con datos del servidor (lazy)**
```html
<p-table [value]="rows()" [lazy]="true" (onLazyLoad)="load($event)" [totalRecords]="total()"
         [paginator]="true" [rows]="20" [rowsPerPageOptions]="[20, 50, 100]" [loading]="loading()"
         dataKey="id" [tableStyle]="{ 'min-width': '50rem' }">
  <ng-template #header>
    <tr><th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th><th>Estado</th><th></th></tr>
  </ng-template>
  <ng-template #body let-row>
    <tr>
      <td>{{ row.nombre }}</td>
      <td><p-tag [value]="row.estado" [severity]="severity(row.estado)" /></td>
      <td><p-button icon="pi pi-pencil" [text]="true" ariaLabel="Editar" (onClick)="edit(row)" /></td>
    </tr>
  </ng-template>
  <ng-template #emptymessage><tr><td colspan="3">Sin registros.</td></tr></ng-template>
</p-table>
```
```ts
load(e: TableLazyLoadEvent) {
  // e.first, e.rows, e.sortField, e.sortOrder, e.filters → query params para la API
}
```
- Más de unos cientos de filas → **lazy** con paginación del servidor, nunca cargar todo.
- `dataKey` siempre (selección, expansión, edición).

**Mensajes y confirmaciones**
```ts
providers: [MessageService, ConfirmationService]   // en el componente o en app.config
```
```html
<p-toast /> <p-confirmdialog />
```
```ts
this.confirm.confirm({
  message: '¿Eliminar el registro?', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
  acceptLabel: 'Eliminar', rejectLabel: 'Cancelar', acceptButtonProps: { severity: 'danger' },
  accept: () => this.delete(id),
});
this.messages.add({ severity: 'success', summary: 'Guardado', detail: 'El registro se guardó.' });
```
- Un solo `<p-toast />` y un `<p-confirmdialog />` en el layout raíz.

**Diálogos**: `<p-dialog [(visible)]="open" [modal]="true" header="…" [style]="{ width: '32rem' }"
[breakpoints]="{ '640px': '95vw' }">`. Para formularios grandes, `DialogService` (dynamic dialog) con
un componente propio.

## Errores frecuentes de agentes
- Ejecutar `npm install primeng@latest` / `ng update` y saltar a la v22 (comercial) sin licencia.
- Usar `p-dropdown`, `p-calendar`, `p-tabView`, `p-sidebar` en proyectos 18+.
- Importar temas de `primeng/resources/themes` en 18+ o `@primeng/themes` en 20+ (es `@primeuix/themes`).
- Cargar tablas grandes completas en vez de `lazy`.
- Olvidar proveer `MessageService`/`ConfirmationService` → error de inyección.
- Sobrescribir clases internas `.p-*` con `::ng-deep` en lugar de tokens del preset.
- Textos del calendario/paginador en inglés: falta `translation`.

## Verificación
- `ng build` sin errores; revisa en el navegador: foco con teclado en select/datepicker/diálogo,
  textos en español, estados de carga/vacío/error en tablas.

## PrimeVue
Mismo sistema de temas (presets `@primeuix/themes`, `definePreset`) y los mismos nombres de componentes
(`Select`, `DatePicker`, `DataTable`...). Configuración: `app.use(PrimeVue, { theme: { preset } })`.
**Licencia:** PrimeVue ≤ 4.x es MIT (última 4.5.5); **PrimeVue 5+ (julio 2026) es comercial con clave**,
igual que PrimeNG 22. Mismas reglas: no actualizar sin licencia confirmada. Ver skill `vue`.
