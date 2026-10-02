---
name: nextjs
description: Next.js App Router (14/15/16) - Server/Client Components, data fetching, caching, Server Actions, rutas, metadata, auth y despliegue. Úsalo al trabajar en un proyecto Next.js.
---

# Next.js

## Antes de empezar
- Versión de `next` y router: `app/` (App Router, por defecto) o `pages/` (legacy). No mezcles
  patrones; en `pages/` usa `getServerSideProps`/API routes.
- Cambios por versión que importan:
  - **15+**: `params`, `searchParams`, `cookies()`, `headers()` son **asíncronos** → `await`.
    `fetch` ya no se cachea por defecto.
  - **16**: Turbopack por defecto; `middleware.ts` pasa a llamarse `proxy.ts`; caché explícita con
    `"use cache"` (Cache Components) si está habilitado en `next.config`.
- Aplica también el skill `react`.

## Estructura (App Router)
```
app/
  layout.tsx            # layout raíz (html/body, fuentes, providers)
  page.tsx
  (marketing)/about/page.tsx      # grupos de rutas sin afectar la URL
  dashboard/
    layout.tsx  page.tsx  loading.tsx  error.tsx  not-found.tsx
    [id]/page.tsx
  api/webhooks/route.ts           # Route Handlers solo para webhooks/integraciones externas
components/  lib/  (o src/ si el proyecto lo usa)
```

## Server vs Client Components
- Todo es **Server Component** por defecto: obtén datos ahí, directo de la DB o servicios.
- `'use client'` solo en hojas interactivas (estado, efectos, eventos, APIs del navegador). Empújalo lo
  más abajo posible en el árbol.
- No pases funciones ni objetos no serializables de Server a Client Components.
- Código solo-servidor (DB, secretos) en módulos con `import 'server-only'`.

```tsx
// app/posts/[id]/page.tsx
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);   // función de lib/ que consulta la DB
  if (!post) notFound();
  return <Article post={post} />;
}
```

## Mutaciones: Server Actions
```ts
'use server';
export async function createPost(prevState: State, formData: FormData) {
  const session = await auth();                       // ¡autoriza siempre! es un endpoint público
  if (!session) return { error: 'No autorizado' };
  const parsed = PostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  await db.post.create({ data: { ...parsed.data, authorId: session.user.id } });
  revalidatePath('/posts');
  redirect('/posts');
}
```
- Valida con zod y autoriza dentro de cada action. Úsalas con `useActionState` en el cliente.
- Tras mutar: `revalidatePath`/`revalidateTag` (o `updateTag` en 16) para refrescar caché.

## Datos y caché
- Paraleliza consultas independientes (`Promise.all`) para evitar cascadas.
- `loading.tsx` / `<Suspense>` para streaming de partes lentas.
- Define explícitamente qué se cachea (`"use cache"` + `cacheLife`/`cacheTag` en 16, o
  `fetch(url, { next: { revalidate: 60, tags: ['posts'] } })` / `unstable_cache` en 14-15).
- Datos por usuario nunca en caché compartida.

## Rutas, metadata, assets
- `generateMetadata` / `export const metadata` por página; `sitemap.ts`, `robots.ts`.
- `next/image` (con `width/height` o `fill` + `sizes`), `next/font` para fuentes, `next/link`.
- `generateStaticParams` para rutas dinámicas estáticas.
- Variables: `NEXT_PUBLIC_*` llegan al navegador; todo lo demás solo servidor.

## Auth y seguridad
- Protege en el servidor (layout/página/action/route handler), no solo en `proxy`/`middleware`
  (úsalo para redirecciones optimistas, no como única barrera).
- Auth.js / Better Auth / Clerk según el proyecto. Sesión verificada en cada acceso a datos
  (patrón Data Access Layer).

## Errores frecuentes de agentes
- `'use client'` en páginas enteras o en el layout raíz.
- Fetch a su propia API (`/api/...`) desde Server Components: llama la función directamente.
- Olvidar `await` en `params`/`cookies()` (15+).
- Usar `useEffect` para cargar datos que podían venir del servidor.
- Server Actions sin validación ni autorización.
- Importar módulos de servidor en componentes cliente (filtra secretos o rompe el build).

## Verificación
- `npm run build` (detecta errores de tipos y de Server/Client), `npm run lint`, tests.
- Prueba la ruta en `next dev` y revisa estados de carga/error/404.
