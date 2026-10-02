---
name: laravel
description: Convenciones Laravel (11+) - estructura, Eloquent, validación con Form Requests, policies, colas, migraciones, Pest y seguridad. Úsalo al crear o modificar cualquier cosa en un proyecto Laravel.
---

# Laravel

## Antes de empezar
- Versión: `composer.json` → `laravel/framework`, o `php artisan --version`.
  - 11+: esqueleto reducido; middleware, excepciones y rutas se configuran en `bootstrap/app.php`
    (no hay `app/Http/Kernel.php`). Casts con el método `casts()`.
  - 10 o menor: existe `Kernel.php` y la propiedad `$casts`. Respeta la estructura del proyecto.
- Revisa paquetes clave: Livewire, Inertia, Filament, Sanctum, Horizon, Pest, Larastan, Pint.
- Usa `php artisan make:*` para generar archivos (respeta stubs y namespaces):
  `make:model Post -mfsc`, `make:request`, `make:policy`, `make:job`, `make:test --pest`.

## Arquitectura
- Controladores delgados: validan (Form Request), autorizan (Policy), delegan y responden.
- Lógica de negocio en **Actions** (`app/Actions/CreateInvoice.php`, una clase con `handle()`)
  o Services si el proyecto ya los usa. No inventes capas que el proyecto no tiene.
- Rutas con nombre y resource controllers: `Route::resource('posts', PostController::class)`.
- Configuración vía `config()`; `env()` **solo** dentro de `config/*.php` (si no, falla con config cache).

## Eloquent
- Define `$fillable` (o el proyecto ya usa `$guarded = []` + validación estricta: respétalo).
- Relaciones con tipos de retorno: `public function author(): BelongsTo`.
- Evita N+1: `with()`/`load()`; en desarrollo activa `Model::preventLazyLoading(! app()->isProduction())`.
- Casts para enums, fechas, JSON, `encrypted`, `hashed`:
  ```php
  protected function casts(): array
  {
      return ['status' => OrderStatus::class, 'paid_at' => 'datetime', 'meta' => 'array'];
  }
  ```
- Scopes para filtros reutilizables; `chunkById()`/`lazy()` para lotes grandes.
- Operaciones multi-tabla dentro de `DB::transaction(fn () => ...)`.
- Dinero en enteros (centavos) o decimal con cast; nunca float.

## Validación y autorización
- Siempre Form Requests para entradas no triviales; usa `$request->validated()`, nunca `$request->all()`
  para crear/actualizar modelos.
- Autorización con Policies (`$this->authorize()`, `Gate`, `->can()` en rutas, `@can` en Blade).
- Reglas: `Rule::unique('users')->ignore($user)`, `Rule::enum(...)`, `exists:`.

## Migraciones
- Nunca edites una migración ya ejecutada en producción: crea una nueva.
- Claves foráneas: `$table->foreignId('user_id')->constrained()->cascadeOnDelete();`
- Índices para columnas de filtrado/orden frecuentes.
- `down()` coherente si el proyecto los mantiene.

## Colas, eventos, correo
- Trabajo lento (correos, PDFs, APIs externas) → Jobs con `ShouldQueue`, `$tries`, `backoff`.
- Pasa IDs o modelos (serializados por `SerializesModels`), no objetos enormes.
- Notificaciones/Mailables encolables.

## API
- API Resources (`JsonResource`) para dar forma a respuestas; no devuelvas modelos crudos con datos
  sensibles.
- Auth de API: Sanctum. Rate limiting en `bootstrap/app.php`/`AppServiceProvider`.
- Paginación: `->paginate()` / `->cursorPaginate()`.

## Blade / frontend
- `{{ }}` escapa; `{!! !!}` solo con HTML confiable y saneado.
- `@csrf` en formularios; `@method('PUT')` para verbos.
- Vite: `@vite(['resources/css/app.css', 'resources/js/app.js'])`.

## Testing (Pest preferido si está instalado)
```php
it('creates a post', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('posts.store'), ['title' => 'Hola', 'body' => 'Texto'])
        ->assertRedirect();

    expect(Post::where('title', 'Hola')->exists())->toBeTrue();
});
```
- `RefreshDatabase` / `LazilyRefreshDatabase`; factories para datos; `Http::fake()`, `Queue::fake()`,
  `Mail::fake()` para efectos externos.

## Errores frecuentes de agentes
- Usar `env()` fuera de config. Olvidar `php artisan config:clear` al cambiar `.env` con caché activo.
- Lógica pesada en controladores o en vistas Blade.
- Consultas en bucles (N+1) y `Model::all()` en tablas grandes.
- Crear rutas sin `name()` ni middleware `auth`.
- Mass assignment con `$request->all()`.

## Verificación
- `php artisan test` (o `vendor/bin/pest`), `vendor/bin/pint --dirty`, `vendor/bin/phpstan` si existe.
- `php artisan route:list --path=...` para revisar rutas; `php artisan migrate --pretend` para ver SQL.
