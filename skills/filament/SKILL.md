---
name: filament
description: Paneles admin con Filament (v3/v4+) sobre Laravel - resources, formularios/schemas, tablas, acciones, widgets, permisos y temas. Úsalo al crear o modificar cualquier cosa de Filament.
---

# Filament

## Antes de empezar: ¡la versión cambia la API!
Revisa `composer.json` → `filament/filament`.

| | v3 | v4 / v5 |
|---|---|---|
| Firma del formulario | `form(Form $form): Form` | `form(Schema $schema): Schema` |
| Infolist | `infolist(Infolist $infolist)` | `infolist(Schema $schema)` |
| Acciones | `Filament\Tables\Actions\*`, `Filament\Forms\Components\Actions\*`... | todas en `Filament\Actions\*` |
| Layout (Section, Grid, Tabs) | `Filament\Forms\Components\*` | `Filament\Schemas\Components\*` |
| Estructura del resource | todo en un archivo | `Resources/Posts/{PostResource.php, Pages/, Schemas/, Tables/}` |
| Tema propio | Tailwind 3 | Tailwind 4 |

v5 mantiene la API de v4 (el salto es por Livewire 4). **Copia el estilo del proyecto**: si los
resources existentes están en un archivo, no reestructures.

Genera siempre con artisan (crea la estructura correcta para la versión instalada):
```bash
php artisan make:filament-resource Post --generate   # --view, --soft-deletes según el caso
php artisan make:filament-relation-manager PostResource comments body
php artisan make:filament-widget StatsOverview --stats-overview
php artisan make:filament-page Settings
```

## Resources
- Un resource por modelo administrable. `$recordTitleAttribute` para búsqueda global.
- Navegación: `$navigationGroup`, `$navigationSort`, `$navigationIcon` (Heroicons, ej. `Heroicon::OutlinedDocumentText` en v4 o `'heroicon-o-document-text'`).
- Labels en español con `$modelLabel` / `$pluralModelLabel` si la app está en español.
- Consultas: sobrescribe `getEloquentQuery()` para scopes globales (tenant, soft deletes) y
  `->modifyQueryUsing(fn ($q) => $q->with('author'))` en la tabla para evitar N+1.

## Formularios (v4)
```php
public static function configure(Schema $schema): Schema
{
    return $schema->components([
        Section::make('Datos')->columns(2)->schema([
            TextInput::make('title')->required()->maxLength(255),
            Select::make('author_id')->relationship('author', 'name')->searchable()->preload()->required(),
            Select::make('status')->options(PostStatus::class)->required(),
            DateTimePicker::make('published_at'),
        ]),
        RichEditor::make('body')->columnSpanFull(),
    ]);
}
```
- Valida en el campo (`->required()`, `->unique(ignoreRecord: true)`, `->rules([...])`).
- Campos dependientes: `->live()` + `->afterStateUpdated()`; `->visible(fn (Get $get) => ...)`.
  Usa `->live(onBlur: true)` en inputs de texto para no disparar requests en cada tecla.
- Enums: implementa `HasLabel` (y `HasColor`, `HasIcon`) en el enum y pásalo a `options()`/badges.
- Archivos: `FileUpload::make('avatar')->image()->disk('public')->directory('avatars')->visibility('public')`.

## Tablas
```php
return $table
    ->columns([
        TextColumn::make('title')->searchable()->sortable(),
        TextColumn::make('status')->badge(),
        TextColumn::make('created_at')->dateTime('d/m/Y H:i')->sortable()->toggleable(isToggledHiddenByDefault: true),
    ])
    ->filters([SelectFilter::make('status')->options(PostStatus::class)])
    ->recordActions([EditAction::make()])               // v3: ->actions([...])
    ->toolbarActions([BulkActionGroup::make([DeleteBulkAction::make()])]) // v3: ->bulkActions([...])
    ->defaultSort('created_at', 'desc');
```

## Acciones
- Acciones personalizadas con `Action::make('approve')->requiresConfirmation()->action(fn (Post $record) => ...)`.
- Formularios en modal: `->schema([...])` (v4) / `->form([...])` (v3).
- Notificaciones: `Notification::make()->title('Guardado')->success()->send();`
- La lógica de negocio va en Actions/Services de Laravel; la acción de Filament solo la invoca.

## Permisos
- Filament respeta las **Policies** del modelo (`viewAny`, `create`, `update`, `delete`...). Crea la
  policy; no ocultes botones a mano.
- Acceso al panel: el modelo `User` implementa `FilamentUser::canAccessPanel(Panel $panel)`.
  En producción sin esto nadie (o todos) entra: revísalo siempre.
- Roles: si el proyecto usa `bezhansalleh/filament-shield` o `spatie/laravel-permission`, úsalo.

## Panel y tema
- Configuración en `app/Providers/Filament/AdminPanelProvider.php` (colores, login, middleware,
  `->discoverResources()`, plugins, `->spa()`).
- Estilos propios: `php artisan make:filament-theme` y regístralo con `->viteTheme(...)`. No
  sobrescribas CSS del vendor.

## Errores frecuentes de agentes
- Mezclar namespaces de v3 y v4 (p. ej. `Filament\Forms\Form` en un proyecto v4).
- Olvidar `->relationship()` en Select de relaciones o `->preload()` en listas cortas.
- Lógica pesada dentro de closures del formulario/tabla en vez de clases de dominio.
- Tablas sin `->searchable()`/`->sortable()` en columnas clave o con N+1 en columnas de relación.
- No correr `php artisan filament:upgrade` tras actualizar (lo hace el post-autoload-dump).

## Verificación
- Tests con Pest + `livewire()`:
  ```php
  livewire(CreatePost::class)->fillForm(['title' => 'Hola'])->call('create')->assertHasNoFormErrors();
  livewire(ListPosts::class)->assertCanSeeTableRecords($posts);
  ```
- Abre el panel y prueba crear/editar/borrar/filtrar con un usuario sin permisos y con permisos.
