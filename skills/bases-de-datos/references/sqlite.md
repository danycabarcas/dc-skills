# SQLite (3.4x+)

Excelente para: apps locales o de escritorio, prototipos, herramientas internas con poca concurrencia
de escritura, caché local, tests rápidos (si producción también es SQLite) y como base por defecto de
Laravel 11+ en desarrollo. No es para: muchas escrituras concurrentes, varios servidores accediendo al
mismo archivo, ni sobre carpetas de red.

## Configuración obligatoria por conexión
```sql
PRAGMA foreign_keys = ON;        -- ¡viene APAGADO por defecto! sin esto las FKs no se validan
PRAGMA journal_mode = WAL;       -- lectores no bloquean al escritor (se guarda en el archivo)
PRAGMA busy_timeout = 5000;      -- espera en vez de fallar con "database is locked"
PRAGMA synchronous = NORMAL;     -- seguro con WAL y bastante más rápido
```
Los frameworks suelen exponer estas opciones (Laravel: `foreign_key_constraints`, `busy_timeout`,
`journal_mode` en `config/database.php`).

## Tipos
- SQLite usa "afinidad" de tipos: acepta cualquier valor en cualquier columna salvo que uses
  **tablas `STRICT`** (3.37+): `CREATE TABLE t (...) STRICT;` → recomendado en tablas nuevas.
- No hay tipo fecha: guarda ISO-8601 en `TEXT` (`2026-10-03T14:00:00Z`) o epoch en `INTEGER`, de forma
  consistente.
- Dinero en `INTEGER` (centavos). Booleanos como `INTEGER` 0/1.
- `INTEGER PRIMARY KEY` es alias del rowid (rápido); `AUTOINCREMENT` solo si no se pueden reutilizar ids.

## Concurrencia
- Un solo escritor a la vez. Transacciones de escritura cortas; `BEGIN IMMEDIATE` para las que leen y
  luego escriben (evita deadlocks de actualización de bloqueo).
- Agrupa inserciones masivas en una transacción (de cientos de escrituras/s a decenas de miles).

## Esquema
- `ALTER TABLE` es limitado (agregar/renombrar columnas sí; cambiar tipos o restricciones requiere
  recrear la tabla: crear nueva → copiar → borrar → renombrar, dentro de una transacción con
  `foreign_keys` apagado temporalmente). Los ORMs suelen hacerlo por ti: revisa el SQL.

## Operación
- Respaldo en caliente: `sqlite3 base.db ".backup respaldo.db"` o `VACUUM INTO 'respaldo.db'`.
  Nunca copies el archivo mientras hay escrituras (y con WAL, copia también `-wal`/`-shm`, o mejor usa
  `.backup`).
- `PRAGMA integrity_check;` para verificar; `PRAGMA optimize;` periódicamente (o al cerrar conexiones).
- Herramientas: `sqlite3` (Laragon lo incluye en `bin/laragon/utils`), DB Browser for SQLite, DBeaver.
