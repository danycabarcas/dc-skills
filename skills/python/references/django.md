# Django (5.2 LTS · 6.x)

Versión en `pyproject.toml`/`requirements` → `django`. **6.x requiere Python 3.12+**; 5.2 es LTS
(soporte hasta abril 2028). Novedades 6.0 a tener en cuenta si el proyecto está ahí: framework de tareas
en segundo plano (`django.tasks`, necesita un backend/worker), *template partials* y soporte nativo de
Content Security Policy.

## Estructura
```
config/            # settings/ (base.py, dev.py, prod.py), urls.py, asgi.py, wsgi.py
apps/
  tramites/
    models.py  admin.py  urls.py  views.py  forms.py  services.py  selectors.py
    migrations/  templates/tramites/  tests/
manage.py
```
- Una app por dominio. Lógica de escritura en `services.py`, consultas complejas en `selectors.py`
  (o managers/querysets propios); vistas delgadas.
- **Modelo de usuario propio desde el día 1** (`AUTH_USER_MODEL = "accounts.User"`, heredando de
  `AbstractUser`). Cambiarlo después es muy costoso.
- Settings por entorno con variables (`django-environ` o `pydantic-settings`); `SECRET_KEY`,
  `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS` desde el entorno.

## Modelos y ORM
```python
class Tramite(models.Model):
    class Estado(models.TextChoices):
        RADICADO = "radicado", "Radicado"
        EN_TRAMITE = "en_tramite", "En trámite"
        CERRADO = "cerrado", "Cerrado"

    radicado = models.CharField(max_length=20, unique=True)
    solicitante = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="tramites")
    estado = models.CharField(max_length=20, choices=Estado, default=Estado.RADICADO, db_index=True)
    valor = models.DecimalField(max_digits=14, decimal_places=2)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creado"]
        indexes = [models.Index(fields=["estado", "creado"])]
        constraints = [models.CheckConstraint(condition=models.Q(valor__gte=0), name="valor_no_negativo")]

    def __str__(self) -> str:
        return self.radicado
```
- `select_related` (FK/1-1) y `prefetch_related` (M2M/reversas) para evitar N+1; revisa con
  django-debug-toolbar o `assertNumQueries`.
- `only()`/`values()` para listados grandes; `iterator(chunk_size=...)` para recorrer muchos registros;
  `bulk_create`/`bulk_update` para cargas.
- `F()` y `update()` para cambios atómicos; `transaction.atomic()` para operaciones de varios pasos;
  `select_for_update()` cuando hay concurrencia sobre la misma fila.
- Restricciones en la base (`UniqueConstraint`, `CheckConstraint`), no solo en formularios.
- Migraciones: `makemigrations` → revisa el archivo → `migrate`. En CI: `makemigrations --check`.
  Nunca edites migraciones ya aplicadas en producción. Migraciones de datos con `RunPython` y función
  reversa.

## Vistas, formularios, plantillas
- Valida con `Form`/`ModelForm` (`clean_<campo>`, `clean`); nunca confíes en `request.POST` crudo.
- CBV genéricas para CRUD estándar; FBV cuando la lógica es particular. `LoginRequiredMixin` /
  `PermissionRequiredMixin` / `@login_required`.
- Autorización por objeto: filtra el queryset por el usuario (`Tramite.objects.filter(solicitante=request.user)`)
  en vez de buscar por id y luego comprobar.
- Plantillas: el autoescape protege de XSS; `|safe`/`mark_safe` solo con HTML saneado. `{% csrf_token %}`
  en todo formulario POST.
- Admin: `list_display`, `list_filter`, `search_fields`, `autocomplete_fields`, `list_select_related`;
  es para personal interno, no para usuarios finales.

## APIs
- **DRF**: `ModelSerializer` con `fields` explícitos (nunca `__all__` con datos sensibles), `ViewSet` +
  routers, `permission_classes`, paginación y throttling globales en `REST_FRAMEWORK`.
- **django-ninja**: alternativa tipada estilo FastAPI con esquemas Pydantic; buena para APIs nuevas.

## Seguridad y despliegue
- `uv run python manage.py check --deploy` sin advertencias antes de producción.
- `DEBUG=False`, `ALLOWED_HOSTS` y `CSRF_TRUSTED_ORIGINS` explícitos, `SECURE_*`/HSTS detrás de HTTPS,
  cookies `Secure`/`HttpOnly`.
- Archivos estáticos con `collectstatic` + WhiteNoise o Nginx; media de usuarios fuera del código y
  validada (tipo/tamaño).
- Servir con gunicorn (WSGI) o uvicorn/daphne (ASGI). Tareas pesadas: Celery (o `django.tasks` con un
  backend en 6.x).

## Tests
```python
import pytest

@pytest.mark.django_db
def test_solo_ve_sus_tramites(client, django_user_model):
    ana = django_user_model.objects.create_user(username="ana", password="x")
    TramiteFactory.create_batch(3, solicitante=ana)
    TramiteFactory.create_batch(2)                  # de otros usuarios
    client.force_login(ana)
    r = client.get("/tramites/")
    assert r.status_code == 200
    assert len(r.context["object_list"]) == 3
```
`pytest-django` + `factory_boy`; `django_assert_num_queries` para vigilar N+1.
