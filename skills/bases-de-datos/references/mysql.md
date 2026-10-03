# MySQL (8.4 LTS · 9.7 LTS) y MariaDB

Soporte a oct-2026: **8.4 LTS** (hasta 2032) y **9.7 LTS** (hasta 2034). **MySQL 8.0 terminó en abril
de 2026**: planifica migrar a 8.4. Las versiones 9.x no-LTS ("innovation") duran pocos meses: no las
uses en producción. MariaDB es un fork que ya diverge (JSON, funciones, replicación): no asumas
compatibilidad total; usa una versión LTS de MariaDB.

## Configuración base
- Motor **InnoDB** siempre. Charset **`utf8mb4`** con colación `utf8mb4_0900_ai_ci` (insensible a
  tildes y mayúsculas) o `utf8mb4_0900_as_cs` si se necesita distinguir. `utf8` (utf8mb3) no guarda
  emojis ni algunos caracteres: no lo uses.
- `sql_mode` estricto (`STRICT_TRANS_TABLES`, `ONLY_FULL_GROUP_BY`...): no lo relajes para "arreglar"
  errores; corrige la consulta.
- Zona horaria: guarda en UTC (`DATETIME` en UTC o `TIMESTAMP`, que convierte y está limitado a 2038).

## Tipos y modelado
- PK `BIGINT UNSIGNED AUTO_INCREMENT`. InnoDB ordena físicamente por la PK: UUID v4 como PK
  fragmenta; si necesitas UUID, usa v7 en `BINARY(16)` (`UUID_TO_BIN(uuid, 1)`).
- `DECIMAL(14,2)` para dinero. `JSON` con columnas generadas indexadas para los campos que se filtran.
- Las FKs se indexan automáticamente.

## Índices y diagnóstico
- `EXPLAIN ANALYZE` (8.0.18+) y `EXPLAIN FORMAT=TREE`. Busca `type: ALL` (full scan) y
  `Using filesort` / `Using temporary` en tablas grandes.
- Índices invisibles (`ALTER TABLE t ALTER INDEX i INVISIBLE`) para probar quitar un índice sin borrarlo.
- Índices funcionales: `CREATE INDEX idx ON usuarios ((LOWER(email)));`
- Log de consultas lentas: `slow_query_log=1`, `long_query_time=1`; `performance_schema` y la
  vista `sys.statements_with_runtimes_in_95th_percentile`.

## DDL en tablas grandes
- `ALGORITHM=INSTANT` (agregar columnas, 8.0.29+ en cualquier posición) e `INPLACE` cuando aplique;
  si la operación copiaría la tabla entera en producción, usar `gh-ost`/`pt-online-schema-change`.

## Funcionalidades útiles
- CTEs, funciones ventana, `INSERT ... ON DUPLICATE KEY UPDATE`, columnas generadas, `CHECK`
  (aplicadas desde 8.0.16), tipos espaciales con SRID + índice `SPATIAL`.

## Operación
- Respaldo lógico: `mysqldump --single-transaction --routines --triggers --events base > base.sql`
  (consistente sin bloquear InnoDB). Bases grandes: MySQL Shell `util.dumpInstance` o respaldos físicos.
- Usuario de la app sin `SUPER`/`GRANT`; solo permisos sobre su base.
- Laragon trae MySQL; para alinearte con producción agrega la misma versión LTS que usa el servidor.
