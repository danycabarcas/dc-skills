---
name: vue
description: Vue 3 moderno con TypeScript - Composition API con <script setup>, props/emits/v-model tipados, composables, Pinia, Vue Router, formularios, peticiones, rendimiento, Nuxt, librerías de UI con sus licencias y pruebas con Vitest. Úsalo al crear o modificar componentes .vue o proyectos Vue/Nuxt.
---

# Vue

## Antes de empezar
- Versión de `vue` (guía para **3.4+**; 3.5 agrega `useTemplateRef`, destructuración reactiva de props
  y `useId`). ¿Vue 2? Es legado sin soporte desde 2024: mantén el estilo del proyecto y propone migrar.
- ¿SPA con Vite o **Nuxt**? (Nuxt 4: código en `app/`, ver sección Nuxt).
- Revisa lo que ya usa el proyecto: Pinia, Vue Router, UI (Vuetify, PrimeVue, Element Plus, shadcn-vue),
  validación (VeeValidate + Zod), estilos (Tailwind), VueUse. Úsalo; no agregues alternativas.
- Si el proyecto usa Options API, respeta ese estilo en los componentes existentes; en nuevos, sigue
  la convención del equipo (por defecto Composition API).

## Componentes
```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { Tramite } from '@/types';

const { tramite, editable = false } = defineProps<{ tramite: Tramite; editable?: boolean }>();
const emit = defineEmits<{ guardar: [id: number]; cancelar: [] }>();
const estado = defineModel<string>('estado', { required: true });   // v-model:estado

const vencido = computed(() => new Date(tramite.vence) < new Date());
</script>

<template>
  <article class="card" :class="{ 'card--alerta': vencido }">
    <h3>{{ tramite.radicado }}</h3>
    <select v-model="estado" :disabled="!editable" aria-label="Estado del trámite">
      <option value="radicado">Radicado</option>
      <option value="cerrado">Cerrado</option>
    </select>
    <button type="button" @click="emit('guardar', tramite.id)">Guardar</button>
  </article>
</template>
```
- `<script setup lang="ts">` + `defineProps`/`defineEmits`/`defineModel` tipados. Nunca mutes props.
- Nombres de componentes en PascalCase y multi-palabra (`TramiteCard.vue`), uno por archivo.
- `v-for` siempre con `:key` estable (id), nunca el índice si la lista cambia; no combines `v-if` y
  `v-for` en el mismo elemento (filtra con un `computed`).
- `computed` para valores derivados; `watch` solo para efectos secundarios (llamadas, sincronizar con
  algo externo). Si escribes `watch(a, () => b.value = ...)`, probablemente debía ser `computed`.
- Referencias al DOM: `useTemplateRef('nombre')` (3.5) o `ref<HTMLElement | null>(null)`.
- `v-html` solo con HTML saneado (DOMPurify): es una puerta de XSS.

## Composables (lógica reutilizable)
```ts
// composables/useTramites.ts
export function useTramites(filtros: MaybeRefOrGetter<Filtros>) {
  const datos = ref<Tramite[]>([]);
  const cargando = ref(false);
  const error = ref<string | null>(null);

  watchEffect(async (onCleanup) => {
    const ctrl = new AbortController();
    onCleanup(() => ctrl.abort());
    cargando.value = true; error.value = null;
    try {
      datos.value = await api.tramites(toValue(filtros), { signal: ctrl.signal });
    } catch (e) {
      if (!ctrl.signal.aborted) error.value = 'No se pudieron cargar los trámites';
    } finally {
      cargando.value = false;
    }
  });
  return { datos, cargando, error };
}
```
- Prefijo `use`, devuelven refs, aceptan refs/getters (`toValue`). Limpieza en `onCleanup` /
  `onUnmounted`. Antes de escribir uno, revisa si **VueUse** ya lo tiene (`useDebounceFn`,
  `useLocalStorage`, `useIntersectionObserver`...).
- Si el proyecto usa TanStack Query (`@tanstack/vue-query`) para datos del servidor, úsalo en lugar de
  composables a mano.

## Estado global: Pinia
```ts
export const useSesionStore = defineStore('sesion', () => {
  const usuario = ref<Usuario | null>(null);
  const esAdmin = computed(() => usuario.value?.rol === 'admin');
  async function iniciar(cred: Credenciales) { usuario.value = await api.login(cred); }
  return { usuario, esAdmin, iniciar };
});
// en componentes: const { usuario, esAdmin } = storeToRefs(useSesionStore());
```
- Solo estado realmente global (sesión, preferencias, carrito); el resto, local o en composables.
- `storeToRefs` al desestructurar (si no, se pierde la reactividad); acciones directamente del store.

## Vue Router
- Rutas con carga diferida: `component: () => import('@/views/TramitesView.vue')`.
- Guards globales para autenticación (`router.beforeEach`) con `meta: { requiereAuth: true }`; la
  autorización real **siempre** en el backend.
- Parámetros como props (`props: true`) para que la vista no dependa de `useRoute`.
- Revisa la versión instalada: la serie 5 integra rutas tipadas/basadas en archivos; sigue la
  configuración que el proyecto ya tenga.

## Formularios y peticiones
- VeeValidate + Zod (`toTypedSchema`) para formularios con reglas; mensajes accesibles junto al campo.
- Cliente HTTP centralizado (`fetch` envuelto o axios con interceptores) en `services/`/`api/`: base URL,
  token, manejo de 401 y errores; los componentes no llaman `fetch` directamente.
- Estados de carga, error y vacío en toda vista con datos; deshabilitar el botón mientras se envía.

## Rendimiento
- Componentes pesados con `defineAsyncComponent`; rutas lazy; `v-memo`/`shallowRef` solo ante un
  problema medido; listas muy largas virtualizadas (`vue-virtual-scroller` o el componente de la UI).
- `KeepAlive` para pestañas que no deben recargarse.

## Librerías de UI: ¡ojo con las licencias!
| Librería | Licencia |
|---|---|
| Vuetify, Element Plus, Naive UI, shadcn-vue, Reka UI, Headless UI | MIT ✅ |
| **PrimeVue 4.x** | MIT ✅ (última: 4.5.5) |
| **PrimeVue 5+** (julio 2026) | **comercial con clave** (PrimeUI License): la Gobernación y empresas medianas no califican para la versión gratuita |
No actualices PrimeVue a 5 sin licencia; fija `"primevue": "~4.5.5"`. Gráficos: `vue-echarts` (MIT, ver
skill `dashboards`); mapas: Leaflet directo o `@vue-leaflet/vue-leaflet` (MIT, ver skill `leaflet`).

## Nuxt (4)
- Código de la app en `app/` (`app/pages`, `app/components`, `app/composables`); API en `server/`.
- Datos: `useFetch` / `useAsyncData` (se resuelven en el servidor y se hidratan); no uses `fetch` en
  `onMounted` para datos de la página.
- Variables: `runtimeConfig` (privadas) y `runtimeConfig.public` (llegan al navegador).
- SEO por página con `useSeoMeta`; rutas del servidor con `defineEventHandler` y validación.

## Pruebas
- **Vitest** + **Vue Test Utils** (o Testing Library) para componentes y composables; `@pinia/testing`
  para stores; Playwright para E2E (skill `webapp-testing`).
- Prueba comportamiento (lo que ve y hace el usuario), no detalles internos.

## Errores frecuentes de agentes
- Desestructurar un store o un `reactive` sin `storeToRefs`/`toRefs` (se pierde la reactividad).
- `watch` para lo que es un `computed`; olvidar `.value` en el script (en el template no va).
- Mutar props; `v-if` + `v-for` juntos; `:key` con índice.
- Agregar PrimeVue 5 o una segunda librería de UI sin preguntar.
- Llamadas HTTP directamente en los componentes y sin cancelación.

## Verificación
- `npm run build` y `vue-tsc --noEmit` (o el type-check del proyecto) sin errores; `npm run lint`;
  `npx vitest run`. Probar la vista con teclado, en móvil y con red lenta.
