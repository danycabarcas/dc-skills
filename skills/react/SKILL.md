---
name: react
description: React (18/19) con TypeScript - componentes, hooks, estado, formularios, data fetching, rendimiento y testing. Úsalo al crear o modificar componentes React (Vite, Next.js, Inertia, React Native web).
---

# React

## Antes de empezar
- Versión de `react` (18 vs 19) y del entorno: Vite SPA, Next.js (usa también el skill `nextjs`),
  Inertia (Laravel), Remix/React Router.
- Revisa qué ya usa el proyecto para estado (Zustand, Redux Toolkit, Context), datos (TanStack
  Query, SWR), formularios (react-hook-form + zod), UI (shadcn/ui, MUI) y estilos (Tailwind). Usa eso.

## Componentes
- Componentes función + TypeScript. Props tipadas con `type`:
  ```tsx
  type ButtonProps = React.ComponentProps<'button'> & { variant?: 'primary' | 'ghost' };

  export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
    return <button className={cn(styles[variant], className)} {...props} />;
  }
  ```
- Un componente por archivo (PascalCase). Componentes pequeños; extrae cuando un bloque tiene
  nombre propio o se repite.
- React 19: `ref` es una prop normal (no hace falta `forwardRef`); `<Context>` como provider.
- Listas con `key` estable (id), nunca el índice si la lista cambia.
- Composición (`children`, slots por props) antes que props booleanas infinitas.

## Estado
- Estado lo más local posible; súbelo solo cuando dos componentes lo necesiten.
- **No dupliques estado derivable**: calcúlalo en el render.
  ```tsx
  const visible = todos.filter((t) => (filter === 'done' ? t.done : true)); // no useState + useEffect
  ```
- Estado del servidor (datos remotos) ≠ estado de UI: usa TanStack Query/SWR (o Server Components
  en Next.js), no `useEffect` + `useState` a mano.
- Estado global solo para lo realmente global (sesión, tema, carrito).

## Efectos
- `useEffect` es para **sincronizar con sistemas externos** (suscripciones, DOM, timers). No para
  transformar datos ni reaccionar a eventos del usuario (eso va en el handler).
- Dependencias completas (respeta `react-hooks/exhaustive-deps`); limpia suscripciones en el return.
- Si escribes `useEffect(() => setX(...), [y])`, probablemente sobra.

## Formularios y acciones (React 19)
- `useActionState` + `<form action={fn}>` para envíos con estado pendiente/errores;
  `useFormStatus` para el botón; `useOptimistic` para UI optimista.
- Formularios complejos: react-hook-form + zod (validación compartida con el backend si es posible).
- Siempre `<label>`, errores accesibles, botón deshabilitado mientras envía.

## Rendimiento
- Si el proyecto usa **React Compiler**, no agregues `useMemo`/`useCallback`/`memo` manuales.
  Sin compiler: úsalos solo ante un problema medido (listas grandes, props a componentes memo).
- Code splitting con `lazy()` + `<Suspense>` en rutas/paneles pesados.
- Listas muy largas: virtualización (`@tanstack/react-virtual`).
- `useTransition`/`useDeferredValue` para mantener la UI fluida en filtros pesados.

## Accesibilidad
- Elementos nativos (`button`, `a`, `input`) antes que divs con handlers.
- Modales/menús: usa la librería del proyecto (Radix/shadcn, Headless UI) que ya gestiona foco y ARIA.
- `alt`, `aria-label` en botones de solo ícono, foco visible.

## Seguridad
- JSX escapa por defecto. `dangerouslySetInnerHTML` solo con HTML saneado (DOMPurify).
- Nunca pongas secretos en el bundle (todo `VITE_*`/`NEXT_PUBLIC_*` es público).

## Testing
- Testing Library + Vitest/Jest: prueba comportamiento (`getByRole`, `userEvent`), no detalles de
  implementación. MSW para mockear la red.

## Errores frecuentes de agentes
- Cadenas de `useEffect` que sincronizan estados entre sí.
- Fetch en `useEffect` sin cancelación ni manejo de error/carga.
- Mutar estado (`arr.push`) en vez de crear uno nuevo.
- Definir componentes dentro de otros componentes (se remontan en cada render).
- Clases Tailwind dinámicas interpoladas.

## Verificación
- `npm run lint`, `npx tsc --noEmit`, tests, y prueba en el navegador: carga, error, vacío, teclado.
