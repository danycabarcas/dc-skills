---
name: php
description: PHP moderno (8.2+) - tipos estrictos, PSR-12, Composer, seguridad y testing. Úsalo al escribir o revisar cualquier código PHP, con o sin framework.
---

# PHP

## Antes de empezar
- Versión real: `composer.json` → `require.php` y `php -v`. Usa solo features de esa versión.
- Herramientas presentes: PHPUnit/Pest, PHPStan/Larastan, Pint/PHP-CS-Fixer, Rector. Úsalas, no
  agregues otras.
- En Laragon (Windows) el PHP activo puede diferir del de `composer.json`; si algo raro pasa,
  comprueba `php -v` y `where php`.

## Estilo
- `declare(strict_types=1);` en archivos nuevos (si el proyecto ya lo usa; en Laravel no es habitual,
  respeta la convención existente).
- PSR-12 / PER-CS; autoload PSR-4. Una clase por archivo; nombre del archivo = nombre de la clase.
- Tipos en **todo**: parámetros, retornos, propiedades. `mixed` solo si de verdad lo es.
  Usa `?Tipo`, uniones `int|string`, `never`, `void`, `static`.
- Clases `final` por defecto si no están pensadas para herencia. `readonly` para value objects/DTOs.
- Constructor property promotion:
  ```php
  final readonly class Money
  {
      public function __construct(
          public int $amount,      // en centavos, nunca float para dinero
          public string $currency,
      ) {}
  }
  ```
- `enum` (backed) en vez de constantes sueltas para estados/tipos:
  ```php
  enum OrderStatus: string
  {
      case Pending = 'pending';
      case Paid = 'paid';

      public function label(): string
      {
          return match ($this) {
              self::Pending => 'Pendiente',
              self::Paid => 'Pagado',
          };
      }
  }
  ```
- `match` en vez de `switch`; nullsafe `?->`; named arguments cuando aclaren llamadas largas.
- Retornos tempranos en vez de `if` anidados. Funciones cortas con un propósito.
- 8.4+: property hooks y visibilidad asimétrica (`public private(set)`) están disponibles; úsalos
  solo si el proyecto ya está en 8.4+.

## Seguridad (no negociable)
- SQL: siempre consultas preparadas (PDO con placeholders u ORM). Nunca concatenar input.
- Salida HTML: `htmlspecialchars($v, ENT_QUOTES, 'UTF-8')` (o el escape del motor de plantillas).
- Contraseñas: `password_hash()` / `password_verify()`. Nunca md5/sha1.
- Aleatorios de seguridad: `random_bytes()`, `random_int()`, nunca `rand()`/`uniqid()`.
- Nunca `eval`, `unserialize` de input de usuario, `extract($_POST)`, ni `include` con rutas
  controladas por el usuario.
- Archivos subidos: valida MIME real y extensión, renombra, guarda fuera de `public/`.
- Secretos en variables de entorno, nunca en el código.

## Errores
- Excepciones específicas (`InvalidArgumentException`, excepciones de dominio propias), no
  `return false` para errores.
- No silencies con `@`. No captures `\Throwable` para ignorarlo; si capturas, registra o relanza.

## Composer
- `composer require` / `composer require --dev`; nunca edites `vendor/`.
- Commitea `composer.lock` en aplicaciones.
- Tras cambiar namespaces: `composer dump-autoload`.

## Errores frecuentes de agentes
- Usar `float` para dinero → usa enteros (centavos) o `brick/money`/bcmath.
- Fechas con `date()`/`strtotime()` en lógica compleja → `DateTimeImmutable` (o Carbon en Laravel).
- Comparaciones `==` con strings numéricos → usa `===`.
- Olvidar `use` de clases al mover código entre namespaces.

## Verificación
- `php -l archivo.php` para sintaxis rápida.
- Tests: `vendor/bin/pest` o `vendor/bin/phpunit`.
- Análisis: `vendor/bin/phpstan analyse` si está instalado.
- Formato: `vendor/bin/pint` o `vendor/bin/php-cs-fixer fix` si está instalado.
