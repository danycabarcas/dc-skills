---
name: python
description: Python experto (3.11-3.14) - uv, pyproject, ruff, tipado estricto, diseño idiomático, async, errores, testing con pytest, rendimiento, seguridad y empaquetado; con guías para FastAPI, Django y datos/ETL (pandas, polars, Excel). Úsalo al escribir, revisar o depurar cualquier código Python.
---

# Python

Escribe Python como un experto: simple, explícito, tipado y probado. Lo idiomático gana a lo ingenioso.

## Antes de empezar
- **Versión**: `requires-python` en `pyproject.toml`, `.python-version`, `python --version`. Usa solo
  features de esa versión (tabla al final). Soportadas a oct-2026: **3.11-3.14** (3.10 ya no tiene
  soporte: si el proyecto la usa, sugiere actualizar).
- **Gestor**: `uv.lock` → uv · `poetry.lock` → Poetry · `Pipfile` → pipenv · solo `requirements.txt` → pip
  + venv. Usa **el que ya tiene** el proyecto. En proyectos nuevos: **uv**.
- **Framework**: FastAPI → lee [references/fastapi.md](references/fastapi.md) · Django →
  [references/django.md](references/django.md) · pandas/polars/Excel/scripts →
  [references/datos.md](references/datos.md).
- Revisa las herramientas configuradas (`[tool.ruff]`, `[tool.mypy]`, `[tool.pytest.ini_options]`) y
  respétalas.

## Proyecto y dependencias (uv)
```bash
uv init --app mi-proyecto            # o --package para librerías / CLIs instalables
uv python pin 3.13                   # fija la versión (.python-version)
uv add fastapi "sqlalchemy>=2.1"     # dependencias de producción
uv add --dev pytest ruff mypy        # grupo dev (PEP 735: [dependency-groups])
uv run pytest                        # ejecuta dentro del entorno, sin activar nada
uv sync --locked                     # CI / despliegue: instala exactamente el lock
uvx ruff check .                     # herramienta efímera sin instalarla en el proyecto
```
- Todo en **`pyproject.toml`** (PEP 621). Nada de `setup.py` nuevo. Commitea `uv.lock` en aplicaciones.
- Nunca `pip install` global ni `sudo pip`. Nunca instales en el Python del sistema.
- Scripts sueltos con dependencias: metadata inline (PEP 723) → `uv add --script tarea.py requests` y
  `uv run tarea.py`.
- Estructura recomendada (layout `src/`):
  ```
  pyproject.toml  uv.lock  .python-version  README.md
  src/mi_paquete/__init__.py  src/mi_paquete/...
  tests/test_*.py
  ```

## Calidad automática
```toml
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "SIM", "C4", "RUF", "S", "PT", "DTZ", "N", "PL"]
ignore = ["PLR0913"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "PLR2004"]

[tool.mypy]
strict = true
```
- `ruff format` + `ruff check --fix` reemplazan black, isort, flake8, pyupgrade.
- Type checker: el del proyecto (mypy, pyright/basedpyright; `ty` de Astral está en beta). En código
  nuevo, `strict`.

## Estilo idiomático
- PEP 8 vía ruff. Nombres: `snake_case` funciones/variables, `PascalCase` clases, `UPPER_CASE` constantes,
  `_privado` para internos.
- Funciones pequeñas con una responsabilidad; retornos tempranos; sin estado global mutable.
- Comprensiones para transformar; generadores para flujos grandes; `itertools` antes que bucles a mano
  (`batched`, `pairwise`, `groupby`, `chain`).
- `pathlib.Path` en vez de `os.path`. `with` para todo recurso (archivos, locks, conexiones, sesiones).
- f-strings para formatear; **nunca** para SQL, comandos de shell ni logs (`log.info("x=%s", x)`).
- `enumerate`, `zip(strict=True)`, desempaquetado, `dict.get`, `collections` (`Counter`, `defaultdict`,
  `deque`).
- **Archivos de texto: siempre `encoding="utf-8"`** (en Windows el default no es UTF-8 hasta 3.15).
- Fechas: `datetime.now(tz=UTC)` / `zoneinfo.ZoneInfo("America/Bogota")`; nunca datetimes "naive" en
  lógica de negocio.
- Dinero: `decimal.Decimal` (o enteros en centavos), nunca `float`.
- Sin argumentos por defecto mutables (`def f(x=None)` y crea la lista dentro).

## Tipado
```python
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Protocol, Self

@dataclass(frozen=True, slots=True)
class Money:
    amount: int          # centavos
    currency: str = "COP"

    def add(self, other: Self) -> Self:
        if other.currency != self.currency:
            raise ValueError("Monedas distintas")
        return type(self)(self.amount + other.amount, self.currency)

class Notifier(Protocol):              # interfaces por estructura, no por herencia
    def send(self, to: str, body: str) -> None: ...

def total[T: Money](items: Iterable[T]) -> int:   # 3.12+: genéricos PEP 695
    return sum(i.amount for i in items)

type UserId = int                      # 3.12+: alias con `type`
```
- Anota **toda** función pública. Acepta tipos abstractos (`Iterable`, `Sequence`, `Mapping`), devuelve
  concretos. `X | None` en vez de `Optional[X]`; `list[int]` en vez de `List[int]`.
- `dataclass(slots=True)` para datos internos; **Pydantic** en los bordes (entrada HTTP, config, JSON
  externo); `TypedDict` para dicts con forma fija; `Enum`/`StrEnum` para estados; `Literal` para
  opciones cerradas.
- `Any` y `# type: ignore` solo con comentario que diga por qué. `cast` como último recurso.
- `@override` (typing, 3.12+) al sobrescribir métodos.

## Errores
- Excepciones específicas; jerarquía propia del dominio (`class AppError(Exception)`, `class
  NotFoundError(AppError)`).
- Nunca `except:` ni `except Exception: pass`. Captura lo que sabes manejar; relanza con contexto:
  `raise ServiceError("No se pudo facturar") from exc`.
- EAFP (`try/except KeyError`) cuando el caso excepcional es raro; LBYL cuando es la ruta normal.
- `logging` (o structlog) con `log = logging.getLogger(__name__)`; nunca `print` en código de aplicación.
  `log.exception(...)` dentro de `except` para conservar el traceback.
- Errores agrupados (3.11+): `ExceptionGroup` + `except*` cuando varias tareas fallan a la vez.

## Concurrencia
- **I/O concurrente** (HTTP, DB) → `asyncio`; **CPU** → `ProcessPoolExecutor` (o free-threaded 3.14t
  si todas las dependencias lo soportan); **bloqueante en código async** → `await asyncio.to_thread(f)`.
- Async estructurado (3.11+):
  ```python
  async with asyncio.TaskGroup() as tg:
      users = tg.create_task(fetch_users())
      orders = tg.create_task(fetch_orders())
  # si una falla, las demás se cancelan y se lanza ExceptionGroup
  ```
- Limita paralelismo contra servicios externos: `asyncio.Semaphore(10)`. Timeouts siempre:
  `async with asyncio.timeout(5):`.
- Nunca llames funciones bloqueantes (`requests`, `time.sleep`, drivers sync) dentro de `async def`.
  Usa `httpx.AsyncClient`, drivers async, `asyncio.sleep`.

## Testing (pytest)
```python
import pytest

@pytest.fixture
def repo() -> InMemoryUserRepo:
    return InMemoryUserRepo()

@pytest.mark.parametrize(("raw", "expected"), [("1.000", 1000), ("2.500,50", 2500.5)])
def test_parse_amount(raw: str, expected: float) -> None:
    assert parse_amount(raw) == pytest.approx(expected)

def test_register_rejects_duplicate(repo: InMemoryUserRepo) -> None:
    register(repo, "ana@x.co")
    with pytest.raises(DuplicateUserError):
        register(repo, "ana@x.co")
```
- Tests junto al comportamiento, no a la implementación. Fixtures pequeñas; `tmp_path` para archivos;
  `monkeypatch` para entorno; `pytest-asyncio`/`anyio` para async; `freezegun`/`time-machine` para fechas.
- Mockea en los **bordes** (HTTP con `respx`/`responses`, reloj, correo), no tu propio dominio.
- Cobertura con `pytest-cov`; apunta a la lógica de negocio, no a un número.

## Rendimiento
- Mide antes de optimizar: `cProfile` / `py-spy` / `pyinstrument`; `timeit` para micro.
- Estructuras correctas: `set`/`dict` para pertenencia, `deque` para colas, `heapq`, `bisect`.
- `functools.cache` / `lru_cache` para funciones puras costosas.
- Datos tabulares: vectoriza con polars/pandas/numpy; nunca bucles fila a fila.
- Evita N+1 contra la base de datos (ver referencias de framework).

## Seguridad
- SQL siempre parametrizado (ORM o placeholders). `subprocess.run([...], check=True)` con lista de
  argumentos, **nunca** `shell=True` con datos externos.
- Nunca `eval`/`exec`, `pickle` de datos no confiables, `yaml.load` sin `SafeLoader`.
- Secretos por entorno (`pydantic-settings`), nunca en el repo; `.env` en `.gitignore`.
- Contraseñas con argon2 (`argon2-cffi`/`pwdlib`) o bcrypt; tokens con `secrets`, no `random`.
- Rutas de archivos de usuario: resuelve y verifica que queden dentro del directorio permitido.
- Peticiones HTTP siempre con `timeout`. Auditoría de dependencias: `uvx pip-audit`.

## Features por versión (úsalas solo si `requires-python` lo permite)
| Versión | Lo más útil |
|---|---|
| 3.11 | `TaskGroup`, `ExceptionGroup`/`except*`, `tomllib`, `Self`, `asyncio.timeout`, ~25% más rápido |
| 3.12 | genéricos `def f[T]()`, `type Alias = ...`, f-strings sin restricciones (PEP 701), `@override`, `itertools.batched` |
| 3.13 | REPL nuevo, `copy.replace()`, free-threading y JIT experimentales; se eliminaron módulos viejos (`cgi`, `telnetlib`, `imghdr`...) |
| 3.14 | anotaciones diferidas (PEP 649: sin comillas para referencias adelantadas), t-strings `t"..."` (PEP 750), `except A, B:` sin paréntesis, free-threading soportado oficialmente, `compression.zstd`, `concurrent.interpreters` |

## Errores frecuentes de agentes
- `pip install` suelto en vez del gestor del proyecto; olvidar actualizar el lock.
- Código para otra versión (genéricos 3.12 en un proyecto 3.10, o `typing.List` en 3.13).
- `requests` dentro de `async def`; olvidar `await`; crear un cliente HTTP por petición.
- `except Exception` que traga errores; `print` para depurar en código final.
- `open()` sin `encoding`; `datetime.now()` sin zona horaria; `float` para dinero.
- Funciones de 100 líneas con lógica, I/O y formato mezclados (separa: leer → transformar → escribir).

## Verificación antes de terminar
```bash
uv run ruff format . && uv run ruff check --fix .
uv run mypy src            # o pyright / ty según el proyecto
uv run pytest -q
```
Y ejecuta el programa/endpoint real al menos una vez con un caso feliz y uno de error.
