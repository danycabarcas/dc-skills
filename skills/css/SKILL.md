---
name: css
description: CSS moderno - variables, layout con grid/flex, responsive, container queries, capas, nesting, temas claro/oscuro y rendimiento. Úsalo al escribir o revisar hojas de estilo (CSS/SCSS) sin framework utilitario.
---

# CSS

## Antes de empezar
- ¿El proyecto usa Tailwind, SCSS, CSS Modules, BEM? Sigue lo que ya existe. Si usa Tailwind,
  aplica el skill `tailwind` y escribe CSS propio solo cuando sea necesario.
- Revisa los navegadores objetivo (`browserslist` en package.json) antes de usar features nuevas.

## Organización
- Tokens de diseño como custom properties en `:root`:
  ```css
  :root {
    --color-bg: #fff;
    --color-text: #16181d;
    --color-primary: #2563eb;
    --radius: .5rem;
    --space-1: .25rem; --space-2: .5rem; --space-4: 1rem; --space-8: 2rem;
    --font-sans: system-ui, sans-serif;
  }
  ```
- Cascade layers para controlar especificidad sin `!important`:
  ```css
  @layer reset, base, components, utilities;
  ```
- Nesting nativo con moderación (máx. 2-3 niveles). Especificidad baja: clases, no IDs ni
  selectores largos.
- Nombres de clase por componente (BEM o el que use el proyecto): `.card`, `.card__title`,
  `.card--featured`.

## Layout
- Grid para 2D, Flex para 1D. `gap` en vez de márgenes entre hijos.
- Patrón de grid responsive sin media queries:
  ```css
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); gap: var(--space-4); }
  ```
- Container queries para componentes que dependen de su contenedor:
  ```css
  .card-wrap { container-type: inline-size; }
  @container (min-width: 30rem) { .card { display: grid; grid-template-columns: 8rem 1fr; } }
  ```
- Mobile-first: estilos base para móvil y `@media (min-width: ...)` para crecer.
- Tipografía y espacios fluidos con `clamp()`: `font-size: clamp(1rem, .9rem + .5vw, 1.25rem);`
- Propiedades lógicas (`margin-inline`, `padding-block`, `inset-inline-start`) para soporte RTL.
- `min-height: 100dvh` en vez de `100vh` en móviles.

## Selectores modernos
- `:has()` para estilos según hijos/estado (`.field:has(input:invalid)`).
- `:is()` / `:where()` (este último con especificidad 0, ideal para resets/base).
- `:focus-visible` para anillos de foco solo con teclado. **Nunca** `outline: none` sin alternativa.

## Temas claro/oscuro
```css
:root { color-scheme: light dark; --color-bg: light-dark(#fff, #0f1115); --color-text: light-dark(#16181d, #e6e8ee); }
body { background: var(--color-bg); color: var(--color-text); }
```
(O redefinir variables dentro de `@media (prefers-color-scheme: dark)` / `[data-theme="dark"]`.)

## Movimiento y rendimiento
- Anima solo `transform` y `opacity`. Evita animar `width/height/top/left`.
- `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`
- Imágenes: `max-width: 100%; height: auto; display: block;` y `aspect-ratio` para reservar espacio.
- `content-visibility: auto` en secciones largas fuera de pantalla.
- Evita `@import` en CSS de producción (bloquea); deja que el bundler empaquete.

## Errores frecuentes de agentes
- Valores mágicos repetidos en vez de variables.
- `!important` para ganar especificidad (síntoma de arquitectura rota).
- `z-index: 9999`: define una escala (`--z-dropdown: 10; --z-modal: 100`).
- Ocultar el foco o depender solo de `:hover` (inaccesible en táctil/teclado).
- Anchos fijos en px que rompen en móvil; `overflow-x` horizontal accidental.

## Verificación
- Revisa a 360px, 768px, 1280px y en modo oscuro.
- Stylelint si el proyecto lo tiene. Sin scroll horizontal en móvil.
