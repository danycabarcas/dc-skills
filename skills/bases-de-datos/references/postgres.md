# PostgreSQL (16 · 17 · 18)

Soporte a oct-2026: 18 (hasta 2030), 17, 16; **14 termina en noviembre de 2026** → planifica actualizar.

## Tipos y modelado
- PK: `id bigint GENERATED ALWAYS AS IDENTITY` (no `serial` en código nuevo). UUID ordenable:
  **`uuidv7()` nativo en 18**; en versiones anteriores, genéralo en la app.
- `timestamptz` siempre (guarda en UTC, convierte en la presentación); `text` con `CHECK (char_length(x) <= n)`
  en vez de `varchar(n)` si el límite es regla de negocio.
- `numeric(14,2)` para dinero. `jsonb` (no `json`) para datos semiestructurados, con índice GIN si se filtra.
- Enums: `CHECK (estado IN (...))` o tabla catálogo; los `ENUM` nativos son difíciles de modificar.
- 18: columnas generadas **virtuales** (calculadas al leer) además de las almacenadas.

## Índices
- B-tree por defecto; **las FKs no se indexan solas**: créalas.
- Parciales: `CREATE INDEX ON tramites (creado) WHERE estado = 'abierto';`
- Expresión: `CREATE INDEX ON usuarios (lower(email));`
- `INCLUDE` para índices que cubren la consulta; GIN para `jsonb`, arrays y búsqueda full-text
  (`tsvector` con configuración `spanish`); GiST para PostGIS y rangos.
- En producción: `CREATE INDEX CONCURRENTLY` (no bloquea escrituras; no va dentro de transacción).

## Diagnóstico
- `EXPLAIN (ANALYZE, BUFFERS) <consulta>`.
- Extensión `pg_stat_statements` para encontrar las consultas que más tiempo consumen.
- Índices sin uso: `pg_stat_user_indexes` con `idx_scan = 0`.
- Autovacuum activo; tablas con muchas actualizaciones pueden necesitar ajustes. Nunca lo desactives.

## Funcionalidades útiles
- `INSERT ... ON CONFLICT (...) DO UPDATE` (upsert), `RETURNING`, CTEs, funciones ventana, `MERGE`.
- Búsqueda en español: `to_tsvector('spanish', texto)` + extensión `unaccent` para ignorar tildes.
- Row Level Security para multi-tenant o datos por dependencia.
- **PostGIS** para datos geográficos (skill `leaflet`): `geometry(Geometry, 4326)` + índice GiST.

## Operación
- Pooling de conexiones (PgBouncer o el pool del framework) si hay muchos procesos/workers.
- Respaldo: `pg_dump -Fc -d base -f base.dump` / restaurar con `pg_restore`; para bases grandes,
  respaldo físico + WAL (pgBackRest).
- Actualizar de versión mayor: `pg_upgrade` o dump/restore, probado antes en una copia.
