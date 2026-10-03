# MongoDB (8.x · 9.0)

Para diseño de esquemas y optimización a fondo usa los skills oficiales de MongoDB importados en el
catálogo: `mongodb-schema-design`, `mongodb-query-optimizer`, `mongodb-connection`.

## Cuándo sí y cuándo no
- Sí: documentos que se leen y escriben juntos, atributos muy variables por registro, catálogos,
  logs/eventos, contenido.
- No: datos muy relacionales con muchas uniones, reportes contables, integridad referencial estricta
  entre muchas entidades (ahí PostgreSQL/MySQL).

## Reglas
- Modela según **los patrones de acceso**: lo que se consulta junto, se guarda junto (embebido); lo
  que crece sin límite o se comparte entre muchos documentos, se referencia.
- Evita arrays sin límite dentro de un documento (máx. 16 MB por documento y rendimiento degradado).
- Valida con **JSON Schema** en la colección (`$jsonSchema`), no solo en la app.
- Índices para cada patrón de consulta (regla ESR: Equality → Sort → Range en índices compuestos);
  revisa con `explain("executionStats")` que no haya `COLLSCAN` en colecciones grandes.
- Geodatos: GeoJSON + índice `2dsphere` (coordenadas `[lng, lat]`).
- Transacciones multi-documento existen, pero si las necesitas a menudo, revisa el modelo.
- Paginación por rango sobre `_id` u otro campo indexado, no `skip()` grande.
- Un solo `MongoClient` por proceso (pool de conexiones), con timeouts definidos.

## Operación
- `mongodump`/`mongorestore` para respaldos lógicos; réplica set incluso con un nodo si usarás
  transacciones o change streams.
- Usuarios con roles mínimos por base; nunca exponer el puerto 27017 a internet.
- Cliente gráfico: MongoDB Compass; shell: `mongosh`.
