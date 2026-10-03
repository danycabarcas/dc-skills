# Datos, ETL y automatización (pandas 3 · polars · Excel)

## ¿pandas o polars?
- **polars**: proyectos nuevos de procesamiento, archivos grandes, pipelines. Más rápido, API
  consistente, ejecución *lazy* (`scan_csv` → `collect`).
- **pandas**: si el proyecto ya lo usa, o se necesita su ecosistema (statsmodels, librerías que
  esperan DataFrame de pandas). Conversión: `pl.from_pandas()` / `df.to_pandas()`.

## pandas 3.x: cambios que rompen código viejo
- **Copy-on-Write siempre activo**: la asignación encadenada `df[df.a > 0]["b"] = 1` **ya no modifica**
  `df`. Usa `df.loc[df.a > 0, "b"] = 1`.
- Texto con dtype `str` por defecto (respaldado por PyArrow si está instalado), no `object`.
- Revisa advertencias de deprecación de 2.x antes de actualizar.

## Reglas
- **Vectoriza**: nada de `iterrows()`/`apply` fila a fila para lo que se puede hacer con operaciones de
  columna, `np.where`, `pl.when().then().otherwise()`, `merge`/`join`, `groupby().agg()`.
- Define dtypes al leer (`dtype=`/`schema_overrides=`) y fechas con `parse_dates` / `try_parse_dates`.
  Códigos con ceros a la izquierda (NIT, cédula, código DANE) **como texto**, nunca como número.
- Métodos encadenados y funciones puras: `leer() → limpiar() → transformar() → validar() → escribir()`.
- Valida esquemas en los bordes (`pandera` o checks propios: columnas requeridas, nulos, rangos, únicos)
  y falla con un mensaje que diga qué fila/columna está mal.
- Memoria: lee solo columnas necesarias (`usecols`/`columns`), por lotes (`chunksize`) o lazy con polars.

## Archivos típicos (Colombia / Excel en español)
```python
# CSV exportado desde Excel en español: separador ';', decimal ',', a veces latin-1 o UTF-8 con BOM
df = pd.read_csv(path, sep=";", decimal=",", thousands=".", encoding="utf-8-sig",
                 dtype={"nit": "string", "cod_dane": "string"})

# Excel: lectura rápida con calamine (uv add python-calamine)
df = pd.read_excel(path, sheet_name="Datos", engine="calamine", dtype={"cedula": "string"})
df_pl = pl.read_excel(path, sheet_name="Datos")       # polars (usa calamine por defecto)

# Escritura con formato: openpyxl / xlsxwriter (encabezados, anchos, formatos numéricos, filtros)
with pd.ExcelWriter(out, engine="openpyxl") as xw:
    df.to_excel(xw, sheet_name="Reporte", index=False)
```
- Si `utf-8-sig` falla con caracteres raros, prueba `cp1252`/`latin-1` y **normaliza todo a UTF-8** al
  escribir.
- Normaliza texto: `str.strip()`, mayúsculas/minúsculas, tildes (`unicodedata.normalize("NFKD", ...)`)
  antes de comparar o unir por nombres (municipios, entidades).

## Bases de datos
- Lectura: `pd.read_sql(query, engine, params=...)` / `pl.read_database(query, connection)` con
  SQLAlchemy; consultas parametrizadas, nunca f-strings.
- Escritura masiva: `to_sql(..., chunksize=1000, method="multi")` o el `COPY` del motor (PostgreSQL);
  dentro de una transacción.
- Credenciales desde el entorno.

## Scripts y procesos ETL
```python
import argparse, logging
from pathlib import Path

log = logging.getLogger(__name__)

def main() -> int:
    p = argparse.ArgumentParser(description="Consolida reportes municipales")
    p.add_argument("entrada", type=Path)
    p.add_argument("--salida", type=Path, default=Path("salida.xlsx"))
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ...
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```
- CLI con `argparse` (o `typer` si ya está); `--dry-run` para procesos que modifican datos.
- **Idempotente**: ejecutarlo dos veces no debe duplicar datos (upserts, claves naturales, marcas de
  procesado).
- Logs con conteos (leídos, válidos, rechazados, escritos) y archivo de rechazos con el motivo.
- Rutas con `Path`, nunca rutas absolutas de una máquina en el código; configuración por argumentos o
  entorno.
- Programación: Programador de tareas de Windows / cron / systemd timers llamando `uv run script.py`.

## Notebooks
- Jupyter para explorar; la lógica reutilizable se mueve a módulos `.py` con tests.
- No commitees outputs con datos personales (`nbstripout`). Reinicia y ejecuta todo antes de compartir.

## Datos personales (Ley 1581 de 2012)
Cédulas, teléfonos, correos y direcciones son datos personales: no los subas a servicios externos ni
los dejes en logs, notebooks o archivos de ejemplo; anonimiza/seudonimiza para pruebas.
