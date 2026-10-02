---
name: html
description: HTML semántico y accesible - estructura, formularios, imágenes, SEO/meta y rendimiento. Úsalo al escribir marcado HTML, plantillas Blade/JSX/Angular o landing pages.
---

# HTML

## Estructura base
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Página · Marca</title>
  <meta name="description" content="Resumen de 150-160 caracteres.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header>…<nav aria-label="Principal">…</nav></header>
  <main id="main">…</main>
  <footer>…</footer>
</body>
</html>
```
- `lang` correcto siempre. Un solo `<main>` y un solo `<h1>` por página.
- Jerarquía de encabezados sin saltos (h1 → h2 → h3) según el contenido, no según el tamaño.

## Semántica
- Usa el elemento correcto: `<button>` para acciones, `<a href>` para navegar. Nunca
  `<div onclick>`.
- `<nav>`, `<header>`, `<footer>`, `<section>` (con encabezado), `<article>`, `<aside>`.
- Listas con `<ul>/<ol>`, datos tabulares con `<table>` + `<caption>`, `<th scope>`.
- `<dialog>` para modales (`showModal()` da foco atrapado y Escape); atributo `popover` para menús
  y tooltips simples.
- `<details>/<summary>` para acordeones sin JS.

## Accesibilidad (WCAG 2.2 AA)
- Todo control interactivo debe ser alcanzable y operable con teclado y tener foco visible.
- Imágenes: `alt` descriptivo; decorativas con `alt=""`. Íconos de solo-ícono en botones con
  `aria-label` o texto oculto (`.sr-only`).
- ARIA solo cuando no hay elemento nativo. Primera regla de ARIA: no uses ARIA si HTML basta.
- Contraste mínimo 4.5:1 en texto normal. No comunicar solo con color.
- Áreas táctiles de al menos 24×24 px (ideal 44×44).
- Respeta `prefers-reduced-motion` en animaciones.

## Formularios
```html
<form method="post" action="/contacto" novalidate>
  <label for="email">Correo</label>
  <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-help">
  <p id="email-help">Te responderemos aquí.</p>
  <button type="submit">Enviar</button>
</form>
```
- Cada input con `<label for>` (no solo placeholder). `type` correcto (`email`, `tel`, `number`,
  `date`), `autocomplete`, `inputmode`.
- Agrupa radios/checkboxes con `<fieldset><legend>`.
- Errores: texto junto al campo, vinculado con `aria-describedby`, y `aria-invalid="true"`.
- `type="button"` en botones que no envían.
- La validación del navegador ayuda, pero **siempre** se valida en el servidor.

## Imágenes y medios
- `width` y `height` siempre (evita saltos de layout/CLS).
- `loading="lazy"` y `decoding="async"` bajo el pliegue; la imagen principal (LCP) sin lazy y con
  `fetchpriority="high"`.
- Responsive: `srcset` + `sizes` o `<picture>` con AVIF/WebP.
- Video: `<video controls preload="metadata">` con subtítulos `<track>`.

## SEO y metadatos
- `<title>` y `meta description` únicos por página; `<link rel="canonical">`.
- Open Graph (`og:title`, `og:description`, `og:image`) para compartir.
- Datos estructurados JSON-LD cuando aplique (Organization, Product, Article, FAQ).
- URLs y textos de enlace descriptivos ("Ver planes", no "clic aquí").

## Rendimiento
- CSS crítico en `<head>`, scripts con `defer` o `type="module"`; nada que bloquee el render sin
  razón.
- `<link rel="preconnect">` a orígenes críticos; `preload` solo para recursos LCP.
- Fuentes con `font-display: swap`.

## Seguridad
- Enlaces externos con `target="_blank"` → `rel="noopener noreferrer"`.
- Nunca insertes HTML de usuario sin escapar (XSS). En plantillas, usa el escape por defecto.

## Verificación
- Navega todo con Tab/Shift+Tab/Enter/Escape.
- Lighthouse (Accesibilidad, SEO, Rendimiento) y validador W3C si hay dudas.
