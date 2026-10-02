---
name: angular
description: Angular moderno (17+) - standalone, signals, control flow, inyección con inject(), formularios, HTTP, rutas lazy, rendimiento y testing; incluye notas para AngularJS 1.x legado. Úsalo al trabajar en proyectos Angular.
---

# Angular

## Antes de empezar
- **¿Angular o AngularJS?** `@angular/core` en package.json = Angular moderno (este skill).
  `angular` 1.x (`ng-app`, `$scope`, controllers) = AngularJS legado, sin soporte desde 2022: ver la
  sección final.
- Versión de `@angular/core`. Guía para 17+; en 20+: zoneless estable y por defecto en proyectos
  nuevos (21), Vitest como runner por defecto en proyectos nuevos (21), APIs de signals estables.
- Genera con el CLI: `ng g component features/users/user-list`, `ng g service`, `ng g guard`.
  Si el proyecto aún usa NgModules, respeta ese estilo en las partes existentes.

## Componentes
```ts
@Component({
  selector: 'app-user-card',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card">
      <h3>{{ user().name }}</h3>
      @if (user().lastLogin; as last) { <p>Último acceso: {{ last | date: 'short' }}</p> }
      <button type="button" (click)="selected.emit(user().id)">Ver</button>
    </article>
  `,
})
export class UserCard {
  user = input.required<User>();
  selected = output<number>();
}
```
- **Standalone** (por defecto desde v19, no hace falta `standalone: true`). `OnPush` siempre.
- `input()`, `output()`, `model()` en vez de `@Input/@Output` en código nuevo.
- Control flow nativo `@if`, `@for (x of xs; track x.id)`, `@switch`; no `*ngIf/*ngFor` en código nuevo.
  `track` es obligatorio: usa un id estable.
- `@defer (on viewport)` para bloques pesados.
- Componentes de presentación (inputs/outputs) separados de contenedores (datos/servicios).

## Estado con signals
- `signal()`, `computed()` para derivados, `effect()` solo para efectos secundarios (logs, sync con
  APIs externas), **nunca** para copiar un signal en otro (usa `computed` o `linkedSignal`).
- Servicios de estado con signals privados y lectura pública:
  ```ts
  @Injectable({ providedIn: 'root' })
  export class CartStore {
    private readonly items = signal<Item[]>([]);
    readonly list = this.items.asReadonly();
    readonly total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
    add(item: Item) { this.items.update((xs) => [...xs, item]); }
  }
  ```
- RxJS para flujos de eventos/streams complejos; puente con `toSignal()` / `toObservable()`.
  Suscripciones manuales con `takeUntilDestroyed()`.

## Inyección y servicios
- `inject()` en vez de inyección por constructor en código nuevo.
- `providedIn: 'root'` para singletons. Configuración de la app en `app.config.ts`
  (`provideRouter`, `provideHttpClient(withInterceptors([...]))`).

## HTTP
- `HttpClient` en servicios; tipa las respuestas. Interceptores funcionales para auth/errores.
- `httpResource()` / `resource()` para cargar datos ligados a signals (si la versión lo trae).
- Nunca llames HTTP desde la plantilla ni en getters.

## Rutas
- Rutas lazy: `loadComponent: () => import('./users/user-list').then(m => m.UserList)` y
  `loadChildren` para grupos. Guards funcionales (`canActivate: [authGuard]`).
- `withComponentInputBinding()` para recibir params como `input()`.

## Formularios
- Reactive Forms tipados (`FormBuilder.nonNullable`) con validadores; muestra errores accesibles.
  (Signal Forms solo si el proyecto ya los adoptó: son experimentales.)

## Seguridad
- Angular sanitiza interpolaciones. Evita `bypassSecurityTrust*` y `innerHTML` con datos de usuario.
- Tokens: preferir cookies HttpOnly; si se usa header, solo vía interceptor.

## Testing
- Runner del proyecto (Vitest en 21+, Karma/Jasmine o Jest en anteriores). `TestBed` con
  `provideHttpClientTesting()`; Testing Library para comportamiento.

## Errores frecuentes de agentes
- Mezclar estilos (NgModule + standalone, `*ngIf` + `@if`) en un mismo archivo nuevo.
- `effect()` para sincronizar estado. Suscripciones sin cleanup.
- Llamar funciones costosas en la plantilla (usa `computed`). Olvidar `track` correcto.
- Importar módulos enteros (`CommonModule`) cuando basta un pipe/directiva concreto.

## AngularJS 1.x (legado)
- Solo mantenimiento: no agregues features grandes; propone migración por partes (Angular moderno o
  React) cuando el usuario lo considere.
- Usa `component()` (no `controller` + `$scope`), `controllerAs`, bindings `<` (one-way) y `&`.
- Inyección con anotaciones explícitas (`['$http', function ($http) {}]`) para no romper al minificar.
- `$http` en servicios; nada de manipular el DOM en controladores (usa directivas).

## Verificación
- `ng build`, `ng test`, `ng lint` (si está configurado) y prueba en `ng serve`.
