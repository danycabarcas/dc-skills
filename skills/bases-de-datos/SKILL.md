---
name: bases-de-datos
description: Diseño, rendimiento y operación de bases de datos relacionales y documentales - elegir motor (PostgreSQL, MySQL/MariaDB, SQLite, MongoDB), modelado, tipos, índices, EXPLAIN, paginación, migraciones sin caída, transacciones, seguridad, respaldos y datos personales. Úsalo al diseñar tablas, escribir consultas o migraciones, o diagnosticar lentitud.
---

# Bases de datos

Notas por motor (léelas solo para el motor del proyecto):
[PostgreSQL](references/postgres.md) · [MySQL / MariaDB](references/mysql.md) ·
[SQLite](references/sqlite.md) · [MongoDB](references/mongodb.md).
Skills complementarios si están instalados: `supabase-postgres-best-practices`,
`mongodb-schema-design`, `mongodb-query-optimizer`.

## Antes de empezar
- Motor y **versión real**: `.env`/config del framework, `SELECT version();`, `mysql --version`.
  Las features cambian mucho entre versiones (ver notas por motor).
- Respeta las convenciones existentes (nombres, claves, timestamps, soft deletes) y el sistema de
  migraciones del framework. Nunca cambies el esquema "a mano" en un entorno compartido.

## Elegir motor (proyectos nuevos)
| Necesidad | Motor |
|---|---|
| Aplicación de negocio general, datos relacionales, reportes, GIS, JSON ocasional | **PostgreSQL** (opción por defecto) |
| Hosting/ecosistema que ya es MySQL, apps PHP tradicionales | **MySQL 8.4/9.7 LTS** o MariaDB LTS |
| App local/embebida, prototipo, tests, herramientas de un solo usuario o pocas escrituras concurrentes | **SQLite** |
| Documentos de forma variable que se leen juntos, catálogos flexibles, eventos | **MongoDB** (si el modelo de verdad es documental) |
| Caché, colas simples, sesiones, contadores | Redis / Valkey (no como base principal) |

## Modelado
- Normaliza hasta 3FN; desnormaliza **solo** con una razón medible (y documéntala).
- Nombres consistentes: `snake_case`; tablas en plural si el framework lo usa (Laravel, Rails);
  FKs `<entidad>_id`.
- Clave primaria: entero autoincremental/identity (`bigint`) por defecto; UUID **v7** (ordenable) si
  se necesitan ids generados fuera de la BD o no adivinables en URLs. Evita UUID v4 como PK en tablas
  grandes (fragmenta índices).
- **Restricciones en la base**, no solo en la app: `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` con
  `ON DELETE` pensado (`RESTRICT` por defecto; `CASCADE` solo para hijos que no existen sin el padre).
- Tipos:
  - Dinero: `DECIMAL(14,2)` (o entero en centavos). **Nunca** `FLOAT/DOUBLE`.
  - Fechas: con zona horaria (`timestamptz` en Postgres; en MySQL guarda UTC). Solo fecha → `DATE`.
  - Identificadores con ceros a la izquierda (cédula, NIT, código DANE, teléfono) → texto.
  - Estados → enum de la app + `CHECK`/tabla catálogo; evita "magic numbers".
  - JSON solo para atributos realmente variables; lo que se filtra o une con frecuencia va en columnas.
- Auditoría: `created_at`, `updated_at`; y si importa quién/qué cambió, tabla de auditoría o eventos.

## Índices
- Indexa columnas de `WHERE`, `JOIN` y `ORDER BY` frecuentes; **todas las FKs** (MySQL lo hace solo,
  Postgres no).
- Compuestos: primero la columna de igualdad más selectiva, luego rangos/orden
  (`(estado, creado_en)` sirve para `WHERE estado = ? ORDER BY creado_en`).
- Únicos para reglas de negocio (`UNIQUE(tipo_documento, numero_documento)`).
- Cada índice cuesta en escrituras y espacio: no indexes "por si acaso"; elimina los que no se usan.
- Funciones sobre la columna (`WHERE LOWER(email) = ?`, `WHERE DATE(creado) = ?`) anulan el índice:
  usa índice de expresión o reescribe como rango (`creado >= '2026-10-01' AND creado < '2026-10-02'`).

## Consultas y rendimiento
- Antes de optimizar: **mide** con `EXPLAIN` / `EXPLAIN ANALYZE` (Postgres, MySQL 8.0.18+) y el log de
  consultas lentas (`pg_stat_statements`, `slow_query_log`).
- Señales de alarma en el plan: escaneo secuencial/full scan sobre tablas grandes, `filesort`/`Sort` de
  muchas filas, estimaciones de filas muy distintas a las reales, nested loops con millones de filas.
- Evita N+1 desde el ORM (eager loading). Selecciona solo columnas necesarias en listados grandes.
- **Paginación**: `OFFSET` grande es lento; para listados profundos o infinitos usa keyset
  (`WHERE (creado, id) < (?, ?) ORDER BY creado DESC, id DESC LIMIT 50`).
- Conteos exactos sobre tablas enormes son caros: cachea o usa estimaciones si la UI lo permite.
- Operaciones masivas por lotes (1.000-10.000 filas) y fuera de horas pico.

## Transacciones y concurrencia
- Todo cambio de varios pasos en una transacción; transacciones **cortas** (nada de llamadas HTTP dentro).
- Contadores/saldos: actualización atómica (`UPDATE ... SET saldo = saldo - ? WHERE id = ? AND saldo >= ?`)
  o `SELECT ... FOR UPDATE`. Nunca leer-calcular-escribir sin bloqueo.
- Idempotencia en procesos reintentables (claves únicas, upserts: `ON CONFLICT` / `ON DUPLICATE KEY`).
- Bloqueos mutuos (deadlocks): orden consistente de actualización y reintento en la app.

## Migraciones sin caída (expand → migrate → contract)
1. **Expandir**: agregar columna/tabla nueva, nullable o con default, sin romper el código actual.
2. **Migrar**: desplegar código que escribe en ambas; rellenar datos en lotes.
3. **Contraer**: cuando nada lee lo viejo, eliminar columna/tabla en otra migración.
- Nunca edites una migración ya aplicada en producción. Renombrar = agregar + copiar + quitar.
- Crear índices en tablas grandes sin bloquear (`CREATE INDEX CONCURRENTLY` en Postgres;
  `ALGORITHM=INPLACE/INSTANT` en MySQL). Revisa el SQL que genera el ORM.
- Toda migración destructiva va precedida de un respaldo verificado.

## Seguridad y datos personales
- Consultas **siempre** parametrizadas. Usuario de la app con privilegios mínimos (sin `DROP`, sin
  superusuario); otro usuario para migraciones.
- Datos personales (Ley 1581 de 2012): minimiza lo que guardas, cifra lo sensible (documentos,
  salud), enmascara en logs y en copias para desarrollo/pruebas. Nunca uses datos reales de
  ciudadanos en entornos locales sin anonimizar.
- Conexiones cifradas (TLS) fuera de localhost; credenciales por entorno.

## Respaldos
- Automáticos, fuera del servidor, con retención definida y **restauración probada** periódicamente
  (un respaldo que nunca se restauró no es un respaldo).
- `pg_dump -Fc`, `mysqldump --single-transaction --routines --triggers`, SQLite `.backup` /
  `VACUUM INTO`, `mongodump`. Para bases grandes: respaldos físicos/incrementales del motor.

## Diagramas
Modelo entidad-relación con Mermaid (`erDiagram`) en la documentación del proyecto, o draw.io para
diagramas editables (skills `mermaid` / `drawio` si están instalados). Actualízalo con cada migración
relevante.

## Errores frecuentes de agentes
- `FLOAT` para dinero; fechas sin zona; cédulas/NIT como número.
- FKs sin índice (Postgres); índices que nunca se usan; funciones sobre columnas indexadas.
- `OFFSET 100000`; `SELECT *` en listados; N+1.
- Editar migraciones ya aplicadas; `DROP COLUMN` en el mismo despliegue que deja de usarla.
- Lógica de concurrencia leer-y-escribir sin transacción ni bloqueo.

## Verificación
- La migración corre de cero y también sobre una copia con datos reales (volumen similar).
- `EXPLAIN ANALYZE` de las consultas nuevas o cambiadas sobre datos realistas.
- Tests de integración contra el **mismo motor** que producción (no SQLite si producción es Postgres).
