---
name: tailwind
description: Tailwind CSS (v3 y v4) - configuración, tokens con @theme, componentes, dark mode, responsive y cambios entre versiones. Úsalo al escribir clases utilitarias o configurar Tailwind.
---

# Tailwind CSS

## Antes de empezar: detecta la versión
`package.json` → `tailwindcss`.

| | v3 | v4 |
|---|---|---|
| Configuración | `tailwind.config.js` | **en el CSS** con `@theme` (sin config JS) |
| Entrada CSS | `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| Integración | plugin PostCSS `tailwindcss` | `@tailwindcss/vite` o `@tailwindcss/postcss` |
| Detección de clases | `content: [...]` | automática; `@source "../ruta";` para rutas extra |
| Dark mode por clase | `darkMode: 'class'` | `@custom-variant dark (&:where(.dark, .dark *));` |

No mezcles sintaxis. Si el proyecto está en v3, no migres sin pedirlo (`npx @tailwindcss/upgrade`).

## v4: configuración
```css
@import "tailwindcss";
@source "../../resources/views";          /* solo si hay rutas que no detecta */

@theme {
  --color-brand-50: oklch(0.97 0.02 260);
  --color-brand-500: oklch(0.55 0.2 260);
  --color-brand-600: oklch(0.48 0.2 260);
  --font-sans: "Inter", system-ui, sans-serif;
  --breakpoint-3xl: 120rem;
}

@utility container-narrow { max-width: 48rem; margin-inline: auto; padding-inline: 1rem; }
```
- Los tokens de `@theme` generan utilidades (`bg-brand-500`, `font-sans`, `3xl:`) **y** variables CSS
  (`var(--color-brand-500)`).
- Variables arbitrarias: `bg-(--mi-color)`; valores arbitrarios: `w-[37rem]`, `grid-cols-[1fr_auto]`.
- Renombres v3 → v4 a tener en cuenta: `shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`,
  `rounded-sm`→`rounded-xs`, `rounded`→`rounded-sm`, `outline-none`→`outline-hidden`,
  `ring` ahora es 1px (usa `ring-3` para el anterior). Opacidad con `/`: `bg-black/50`
  (no `bg-opacity-*`).

## Reglas de uso
- Mobile-first: clase base = móvil, prefijos `sm: md: lg: xl:` para crecer.
- Orden legible (el plugin `prettier-plugin-tailwindcss` lo hace solo si está instalado):
  layout → box → tipografía → color → estados.
- **Componentes, no `@apply`**: repite clases en un componente (Blade, React, Angular) en vez de crear
  clases con `@apply`. Usa `@apply` solo para estilos de terceros o contenido que no controlas.
- Variantes condicionales con `clsx`/`cn()` (`tailwind-merge` si existe) en React; nunca construyas
  nombres de clase concatenando strings dinámicos (`bg-${color}-500` no se detecta):
  ```ts
  const styles = { primary: 'bg-brand-600 text-white', ghost: 'bg-transparent text-brand-600' };
  ```
- Estados: `hover:`, `focus-visible:`, `disabled:`, `aria-[invalid=true]:`, `data-[state=open]:`,
  `group-hover:`, `peer-invalid:`, `has-[:checked]:`.
- Accesibilidad: siempre `focus-visible:ring-2 focus-visible:ring-brand-500` (o equivalente) en
  interactivos; `sr-only` para texto solo de lectores; `motion-safe:`/`motion-reduce:`.
- Dark mode: `dark:bg-gray-900 dark:text-gray-100` en cada superficie que cambie.
- Contenedores: `container-type` con `@container` y variantes `@sm: @md:` (v4 nativo).

## Patrón de componente (botón)
```html
<button type="button"
  class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white
         shadow-xs hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2
         focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
  Guardar
</button>
```

## Con frameworks
- Laravel + Vite: CSS en `resources/css/app.css`; v4 detecta las vistas Blade automáticamente.
- Filament: para estilos propios crea un tema (`make:filament-theme`), no edites el CSS del panel.
- Next.js/React: importa el CSS global en el layout raíz.
- Angular: `@import "tailwindcss";` en `styles.css`.

## Errores frecuentes de agentes
- Escribir config v3 (`tailwind.config.js`, `@tailwind base`) en un proyecto v4 o viceversa.
- Clases dinámicas por interpolación que no se generan.
- Usar colores hex arbitrarios por todos lados en vez de tokens del tema.
- Olvidar estados de foco y dark mode.

## Verificación
- `npm run build` sin advertencias y revisa el resultado en móvil/escritorio/oscuro.
