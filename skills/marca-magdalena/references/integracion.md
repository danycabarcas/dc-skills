# Integración · Marca Magdalena en stacks DAYTECHCO

`BASE` = `https://manualdemarca.magdalena.gov.co`. Para otros stacks (Bootstrap, Angular Material,
PrimeNG, MUI, Vue, Java, WordPress, móvil) sigue `docs/<stack>.md` del repo
https://github.com/danycabarcas/manual_de_marca.

## Traer los archivos al proyecto (opción sin internet)
Copia solo lo que el proyecto use desde el kit (clónalo o descarga
`BASE/dist/downloads/kit-desarrollo-css-y-temas.zip` y `logos-svg.zip`):

```powershell
# desde la raíz del proyecto Laravel; KIT = carpeta del repo manual_de_marca
New-Item -ItemType Directory -Force public/brand | Out-Null
Copy-Item -Recurse $KIT/dist/css, $KIT/assets/logos, $KIT/assets/favicon public/brand/
```
Resultado: `public/brand/css/…`, `public/brand/logos/svg/…`, `public/brand/favicon/…`.
En intranet aloja también Montserrat (p. ej. paquete `@fontsource/montserrat` o archivos en
`public/fonts`) y elimina la importación de Google Fonts.

## Laravel + Blade
```blade
{{-- resources/views/layouts/app.blade.php --}}
<link rel="icon" href="{{ asset('brand/favicon/favicon.ico') }}">
<link rel="stylesheet" href="{{ asset('brand/css/magdalena.min.css') }}">
@vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="mg-base">
  <header class="mg-navbar mg-navbar--stripe">
    <a class="mg-navbar__brand" href="{{ route('home') }}">
      <img src="{{ asset('brand/logos/svg/logo-horizontal-color.svg') }}" alt="Gobernación del Magdalena" height="40">
    </a>
  </header>
  <main class="mg-container">{{ $slot }}</main>
  <footer class="mg-footer"><hr class="mg-stripe">…</footer>
</body>
```
Crea un componente Blade (`<x-brand.logo variant="blanco" />`) si el logo aparece en varias vistas.

## Laravel + Vite + Tailwind v4 (Laravel 12 / Breeze actual)
```css
/* resources/css/app.css  — copia dist/tailwind/magdalena.tailwind-v4.css a resources/css/ */
@import "tailwindcss";
@import "./magdalena.tailwind-v4.css";
```
Clases disponibles: `bg-mg-primary-600`, `text-mg-primary-700`, alias `primary`, degradados
`bg-mg-grad-{action,sky,stripe,…}`, `shadow-mg-md`, `rounded-mg-lg`, `font-display`,
`mg-text-gradient`. Ejemplo:
```html
<button class="bg-mg-grad-action text-white font-bold px-6 py-3 rounded-full shadow-mg-md
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mg-primary-500">Ingresar</button>
<div class="h-[3px] bg-mg-grad-stripe"></div>  <!-- la línea -->
```
Tailwind v3: `presets: [require('./magdalena.tailwind.preset.cjs')]` en `tailwind.config.js`.

## Filament (v3 / v4)
El kit no trae un tema Filament; esta es la integración recomendada por el equipo DAYTECHCO.

```php
// app/Providers/Filament/AdminPanelProvider.php
use Filament\Support\Colors\Color;
use Filament\View\PanelsRenderHook;
use Illuminate\Support\HtmlString;

return $panel
    ->colors([
        'primary' => Color::hex('#0071BB'),
        'info'    => Color::hex('#00B7D9'),
        'success' => Color::hex('#69B75E'),
        'warning' => Color::hex('#FEC800'),
        'danger'  => Color::hex('#F7003C'),
        'gray'    => Color::Slate,   // gris azulado, cercano a --mg-gray
    ])
    ->font('Montserrat')
    ->brandName('Gobernación del Magdalena')
    ->brandLogo(asset('brand/logos/svg/logo-horizontal-color.svg'))
    ->darkModeBrandLogo(asset('brand/logos/svg/logo-horizontal-blanco.svg'))
    ->brandLogoHeight('2.5rem')
    ->favicon(asset('brand/favicon/favicon.ico'))
    // La línea como firma fina arriba de todo el panel
    ->renderHook(PanelsRenderHook::BODY_START, fn () => new HtmlString(
        '<div aria-hidden="true" style="height:3px;background:url(' . asset('brand/logos/svg/barra-franjas.svg') . ') center/100% 100% no-repeat"></div>'
    ));
```
- `Color::hex()` genera la escala a partir del color base; se aproxima (no es idéntica) a las escalas
  50-950 del kit. Si se requiere exactitud, crea un tema (`php artisan make:filament-theme`) e importa
  `magdalena-tokens.css` para usar las variables en estilos propios.
- Mantén el estilo sobrio: no pongas degradados en el sidebar ni tarjetas de colores; deja que el azul
  institucional sea el único color dominante.
- Página de login: si se personaliza, usa el logo vertical a color sobre fondo claro.

## AdminLTE (incluye jeroennoten/laravel-adminlte)
Carga el CSS de la marca **después** del de AdminLTE:
```blade
@push('css')
  <link rel="stylesheet" href="{{ asset('brand/adminlte/magdalena-adminlte3.min.css') }}">
@endpush
```
(AdminLTE 4: `magdalena-adminlte4.min.css`.) Sidebar `sidebar-dark-primary`, logo
`logo-horizontal-blanco.svg` en el brand del sidebar.

## Next.js / React
```tsx
// app/layout.tsx  (copia dist/css/magdalena.min.css a styles/)
import '../styles/magdalena.min.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="mg-base">{children}</body></html>;
}
```
Con Tailwind v4 usa el tema CSS como en Laravel. MUI: `dist/mui/magdalena-mui-theme.mjs`.
Logos con `next/image` (`width`/`height` reales del SVG o solo `height` vía CSS).

## Angular
`angular.json` → `"styles": ["src/styles/magdalena.css", "src/styles.scss"]`.
Angular Material: `@use './magdalena-theme' as mg;` desde `dist/angular-material/_magdalena-theme.scss`
(ver `docs/angular-material.md` del kit). PrimeNG 18+: `dist/primeng/magdalena-preset.ts`.
