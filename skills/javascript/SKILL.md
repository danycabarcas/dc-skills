---
name: javascript
description: JavaScript moderno en el navegador (ES2022+) sin framework o junto a Blade/Livewire/Alpine - módulos, DOM, eventos, fetch y async, formularios, estado simple, rendimiento, accesibilidad y seguridad (XSS). Úsalo al escribir JS de páginas, scripts de vistas, widgets o al migrar código jQuery.
---

# JavaScript (navegador)

Para backend o scripts de Node usa el skill `nodejs`; para React/Angular, sus skills.

## Antes de empezar
- ¿Cómo se carga el JS? Vite (`resources/js`, `src/`), `<script type="module">`, o scripts sueltos.
  Sigue lo que ya usa el proyecto. ¿Hay Alpine.js/Livewire? Úsalos para interactividad simple antes de
  escribir JS a mano.
- ¿TypeScript o JSDoc? Si el proyecto tiene `tsconfig.json`, escribe TS.
- Navegadores objetivo (`browserslist`): ES2022+ funciona en todos los navegadores actuales.

## Estilo
- Módulos ES (`import`/`export`), `const` por defecto, `let` si se reasigna; nunca `var`.
- Funciones pequeñas, nombres descriptivos en inglés (o la convención del proyecto).
- `===` siempre; optional chaining `?.` y `??` en vez de cadenas de `&&`/`||` con valores falsy.
- Sin variables globales: todo dentro de módulos; si hay que exponer algo, un solo namespace.
- **No agregues jQuery** a código nuevo; si existe, no lo extiendas: `querySelector`, `classList`,
  `fetch`, `addEventListener` cubren lo mismo.

## DOM y eventos
```js
const form = document.querySelector('#form-tramite');
const lista = document.querySelector('[data-lista]');

// Delegación: un listener para muchos elementos (incluidos los que se agregan después)
lista.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-accion="eliminar"]');
  if (!btn) return;
  eliminar(btn.dataset.id);
});
```
- Selecciona por `data-*` o ids estables, no por clases de estilo (que cambian al rediseñar).
- Crea nodos con `document.createElement` + `textContent`, o `<template>` + `cloneNode`.
- **Nunca** `innerHTML` con datos del usuario o del servidor sin escapar (XSS). Si necesitas HTML,
  sanitiza (DOMPurify) o construye nodos.
- Agrupa cambios grandes con `DocumentFragment`; evita leer y escribir layout alternadamente en bucles.
- `AbortController` para quitar listeners y cancelar peticiones al destruir un componente.

## fetch y async
```js
async function obtenerJSON(url, { signal, timeout = 10000 } = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    signal: signal ?? AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.json();
}
```
- `fetch` no falla con 4xx/5xx: revisa `res.ok`. Siempre timeout o señal de cancelación.
- POST en Laravel: incluye el token CSRF (`<meta name="csrf-token">` → header `X-CSRF-TOKEN`).
- Muestra estados de carga, error y vacío; deshabilita el botón mientras se envía (evita doble envío).
- Búsquedas mientras se escribe: debounce (250-400 ms) y cancela la petición anterior.
- Paraleliza peticiones independientes con `Promise.all`; maneja errores con `try/catch` donde puedas
  mostrar algo útil al usuario.

## Formularios
- Usa la validación nativa (`required`, `type`, `pattern`) + `form.reportValidity()`, y valida
  también en el servidor (siempre).
- `new FormData(form)` para enviar; `Object.fromEntries(formData)` si necesitas un objeto.
- Mensajes de error junto al campo con `aria-describedby` y `aria-invalid="true"`.

## Estado y estructura
- Para widgets simples: un objeto de estado + una función `render()` que actualiza el DOM a partir del
  estado. Si crece mucho (varias vistas, mucho estado compartido), propone Alpine, Livewire o un
  framework en vez de reinventarlo.
- Persistencia ligera: `localStorage` solo para preferencias (envuelto en `try/catch`), nunca datos
  sensibles ni tokens.

## Rendimiento
- Carga diferida: `<script type="module">` (diferido por defecto), `import()` dinámico para código
  pesado que no se usa al inicio (mapas, gráficas, editores).
- `IntersectionObserver` para carga perezosa y animaciones al hacer scroll; `requestAnimationFrame`
  para animaciones; listeners `passive: true` en `scroll`/`touch`.
- Formato local: `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`,
  `Intl.DateTimeFormat('es-CO')`.

## Accesibilidad
- Elementos interactivos nativos (`button`, `a`); si un `div` se vuelve interactivo, está mal.
- Al abrir modales/menús: mueve el foco, permite cerrar con Escape y devuelve el foco al cerrar
  (`<dialog>` nativo lo resuelve).
- Anuncia cambios dinámicos importantes con una región `aria-live="polite"`.

## Errores frecuentes de agentes
- `innerHTML` con datos externos; olvidar `res.ok`; peticiones sin timeout.
- Listeners agregados en cada render (fugas y eventos duplicados).
- Agregar jQuery o librerías para cosas que el navegador ya hace.
- JS que rompe Livewire: manipular el DOM que Livewire controla (usa `wire:ignore` en esos nodos).

## Verificación
- Consola del navegador sin errores ni advertencias; red sin peticiones duplicadas.
- Probar con teclado, en móvil y con red lenta (DevTools → throttling).
