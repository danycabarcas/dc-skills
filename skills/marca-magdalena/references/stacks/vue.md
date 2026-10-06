# Vue / Nuxt (Vuetify, PrimeVue)

## CSS global
```js
// src/main.js (o main.ts)
import './assets/magdalena.min.css';   // copiado de dist/css/
```

## Nuxt
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/css/magdalena.min.css'],
  app: { head: { link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap' }] } },
});
```

## Vuetify
```js
import 'vuetify/styles';
import vuetify from './magdalena-vuetify.mjs';   // dist/vuetify/ (incluye magdalena-tokens.mjs)
app.use(vuetify);
```
El kit se validó con Vuetify 3; con Vuetify 4 revisa que la creación del tema siga funcionando.

## PrimeVue
```js
import PrimeVue from 'primevue/config';
import { MagdalenaPreset } from './magdalena-preset.mjs';   // dist/primeng/ (mismo preset que PrimeNG)
app.use(PrimeVue, { theme: { preset: MagdalenaPreset, options: { darkModeSelector: false } } });
```
⚠ **PrimeVue 5+ es comercial con clave de licencia**; sin licencia usa 4.x (última MIT: 4.5.5).
