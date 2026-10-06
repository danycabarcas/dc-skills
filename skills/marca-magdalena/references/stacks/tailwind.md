# Tailwind CSS (v3 y v4), con cualquier framework

## v4 (CSS)
```css
@import "tailwindcss";
@import "./magdalena.tailwind-v4.css";   /* copiado de dist/tailwind/magdalena.tailwind-v4.css */
```

## v3 (preset)
```js
// tailwind.config.js
module.exports = {
  presets: [require('./magdalena.tailwind.preset.cjs')],   // dist/tailwind/
  content: ['./src/**/*.{html,js,ts,jsx,tsx,vue}'],
};
```

## Clases disponibles
Colores `mg-*` con escala 50-950 (`bg-mg-primary-600`, `text-mg-primary-700`, `bg-mg-cyan-100`), alias
`primary`, degradados `bg-mg-grad-{primary,sky,action,stripe,…}`, `shadow-mg-md`, `rounded-mg-lg`,
`font-display`, `mg-text-gradient`.
```html
<button class="bg-mg-grad-action text-white font-bold px-6 py-3 rounded-full shadow-mg-md
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mg-primary-500">Ingresar</button>
<div class="h-[3px] bg-mg-grad-stripe" aria-hidden="true"></div>   <!-- la línea -->
```
