# Java, .NET y WordPress

Los CSS de la marca son estáticos: no dependen del lenguaje del servidor.

## Spring Boot + Thymeleaf
Copia `dist/css` y `assets/logos` a `src/main/resources/static/brand/`.
```html
<link rel="stylesheet" th:href="@{/brand/css/magdalena.min.css}">
<img th:src="@{/brand/logos/svg/logo-horizontal-color.svg}" alt="Gobernación del Magdalena" height="48">
```

## JSF / PrimeFaces
`<h:outputStylesheet name="brand/css/magdalena.min.css" />`; en el tema de PrimeFaces sobrescribe el
color primario con `#0071BB`.

## Vaadin (Lumo)
```css
@import url('./magdalena-tokens.css');
html {
  --lumo-primary-color: #0071BB;
  --lumo-primary-text-color: #0071BB;
  --lumo-primary-color-50pct: rgba(0, 113, 187, .5);
  --lumo-primary-color-10pct: rgba(0, 113, 187, .1);
  --lumo-primary-contrast-color: #fff;
  --lumo-font-family: 'Montserrat', sans-serif;
}
```

## ASP.NET / Razor / Blazor
```html
<link rel="stylesheet" href="~/brand/css/magdalena.min.css" asp-append-version="true" />
```

## WordPress
```php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('magdalena', get_template_directory_uri() . '/brand/css/magdalena.min.css', [], '1.0.0');
});
```
Paleta en el editor de bloques (`theme.json` → `settings.color.palette`): primario `#0071BB`, cian
`#00B7D9`, celeste `#9FD7E5`, rojo `#F7003C`, amarillo `#FEC800`, verde `#69B75E`.
