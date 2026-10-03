# FastAPI (0.11x+ · Pydantic v2 · SQLAlchemy 2.x)

## Estructura
```
src/app/
  main.py              # crea la app, lifespan, routers, middlewares
  core/config.py       # Settings (pydantic-settings)
  core/db.py           # engine, session factory, dependencia get_session
  core/security.py     # hashing, JWT, dependencia current_user
  modules/users/
    router.py  schemas.py  models.py  service.py  repository.py
tests/
```
Routers delgados → servicios con la lógica → repositorios/ORM. Instala con
`uv add "fastapi[standard]"`; desarrollo con `uv run fastapi dev src/app/main.py`.

## Configuración
```python
from pydantic import PostgresDsn, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: PostgresDsn
    jwt_secret: SecretStr
    debug: bool = False

settings = Settings()  # falla al arrancar si falta algo
```

## App y ciclo de vida
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # abrir recursos compartidos (pool HTTP, caché)
    yield
    await engine.dispose()

app = FastAPI(title="Trámites API", lifespan=lifespan)   # no uses @app.on_event (deprecado)
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
```

## Esquemas (Pydantic v2)
```python
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=10)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)   # construir desde objetos ORM
    id: int
    email: EmailStr
    full_name: str
```
- Esquemas de entrada y salida **separados**; nunca devuelvas el modelo ORM ni campos sensibles.
- v2: `model_dump()`, `model_validate()`, `field_validator`, `model_validator`, `ConfigDict`
  (no `.dict()`, `parse_obj`, `class Config`, `@validator` de v1).

## Dependencias y rutas
```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]

router = APIRouter()

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, session: SessionDep) -> UserOut:
    user = await users_service.create(session, data)
    return UserOut.model_validate(user)

@router.get("")
async def list_users(
    session: SessionDep, _: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1, size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[UserOut]:
    ...
```
- `Annotated[..., Depends(...)]` reutilizable. El tipo de retorno define `response_model`.
- `async def` solo si todo lo de dentro es async; con librerías bloqueantes usa `def` (FastAPI lo corre
  en un threadpool).
- Errores de dominio → `HTTPException` en el router, o `app.exception_handler(DomainError)` central.
- Paginación siempre en listados; límites máximos en `Query`.

## Base de datos (SQLAlchemy 2 async)
```python
from sqlalchemy import String, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, selectinload

engine = create_async_engine(str(settings.database_url), pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase): ...

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)

async def get_session():
    async with SessionLocal() as session:
        yield session

# consultas estilo 2.0
users = (await session.scalars(select(User).where(User.active).options(selectinload(User.roles)))).all()
```
- Estilo 2.0 (`select()`, `session.scalars`), no `session.query()`.
- Carga relaciones explícitamente (`selectinload`/`joinedload`): en async el lazy loading falla.
- Transacciones: `async with session.begin():` para operaciones de varios pasos.
- Migraciones con **Alembic**: `alembic revision --autogenerate -m "..."` y **revisa** el archivo
  generado antes de aplicarlo.

## Seguridad
- `OAuth2PasswordBearer` + JWT (`pyjwt`), expiración corta; hash con `pwdlib[argon2]` (passlib no se
  mantiene).
- CORS con orígenes explícitos; nunca `allow_origins=["*"]` con credenciales.
- Rate limiting en el proxy o con `slowapi`. Tamaño máximo de subida de archivos.
- `/docs` deshabilitado o protegido en producción si la API no es pública.

## Tareas
- Cortas y no críticas: `BackgroundTasks`. Pesadas, reintentos o programadas: Celery / ARQ / Dramatiq
  con Redis.

## Tests
```python
import pytest
from httpx import ASGITransport, AsyncClient

@pytest.fixture
async def client():
    app.dependency_overrides[get_session] = override_session   # DB de prueba
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

async def test_create_user(client: AsyncClient) -> None:
    r = await client.post("/api/v1/users", json={"email": "a@x.co", "full_name": "Ana", "password": "x" * 12})
    assert r.status_code == 201
```

## Despliegue
`uv run fastapi run` o `uvicorn app.main:app --workers N` (o gunicorn con workers uvicorn) detrás de
Nginx; `--proxy-headers` si hay proxy. Health check `/health`. Logs JSON.
