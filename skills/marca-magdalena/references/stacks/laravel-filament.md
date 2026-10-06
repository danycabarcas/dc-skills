# Laravel (Blade, Vite) y Filament

## Archivos
Copia `dist/css`, `assets/logos` y `assets/favicon` del kit a `public/brand/` (o enlaza por URL).

## Blade
```blade
<link rel="icon" href="{{ asset('brand/favicon/favicon.ico') }}">
<link rel="stylesheet" href="{{ asset('brand/css/magdalena.min.css') }}">
<body class="mg-base">
  <header class="mg-navbar mg-navbar--stripe">
    <a class="mg-navbar__brand" href="{{ route('home') }}">
      <img src="{{ asset('brand/logos/svg/logo-horizontal-color.svg') }}" alt="Gobernación del Magdalena" height="40">
    </a>
  </header>
```
Con Tailwind v4 (Laravel 12): `@import "tailwindcss"; @import "./magdalena.tailwind-v4.css";` en
`resources/css/app.css` (ver [tailwind.md](tailwind.md)). AdminLTE: ver
[bootstrap-adminlte.md](bootstrap-adminlte.md).

## Filament (v3 / v4)
El kit no trae tema Filament; integración recomendada:
```php
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
        'gray'    => Color::Slate,
    ])
    ->font('Montserrat')
    ->brandName('Gobernación del Magdalena')
    ->brandLogo(asset('brand/logos/svg/logo-horizontal-color.svg'))
    ->darkModeBrandLogo(asset('brand/logos/svg/logo-horizontal-blanco.svg'))
    ->brandLogoHeight('2.5rem')
    ->favicon(asset('brand/favicon/favicon.ico'))
    ->renderHook(PanelsRenderHook::BODY_START, fn () => new HtmlString(
        '<div aria-hidden="true" style="height:3px;background:url(' . asset('brand/logos/svg/barra-franjas.svg') . ') center/100% 100% no-repeat"></div>'
    ));
```
`Color::hex()` genera la escala automáticamente (aproximada a la del kit). Para exactitud, crea un tema
(`php artisan make:filament-theme`) e importa `magdalena-tokens.css`.
