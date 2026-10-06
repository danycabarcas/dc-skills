# Python (Django, Flask, FastAPI, gráficos y reportes)

El kit no trae una guía de Python; usa los tokens oficiales (`dist/tokens/magdalena-tokens.json`).

## Web
Copia `dist/css/` y `assets/logos/` a la carpeta de estáticos y enlázalos en la plantilla base:
- Django: `static/brand/...` → `<link rel="stylesheet" href="{% static 'brand/css/magdalena.min.css' %}">`
- Flask: `static/brand/...` → `{{ url_for('static', filename='brand/css/magdalena.min.css') }}`
- FastAPI: `app.mount("/brand", StaticFiles(directory="brand"), name="brand")`

Después aplica la estructura y componentes de [web-css.md](web-css.md).

## Tokens
```python
import json
from pathlib import Path

TOKENS = json.loads(Path("brand/magdalena-tokens.json").read_text(encoding="utf-8"))
AZUL = TOKENS["colors"]["primary"]["hex"]          # "#0071BB"
ESCALA_AZUL = TOKENS["scales"]["primary"]          # {"50": ..., "950": ...}
```

## Gráficos (matplotlib / plotly)
```python
import matplotlib.pyplot as plt
from cycler import cycler

plt.rcParams["axes.prop_cycle"] = cycler(color=["#0071BB", "#00B7D9", "#69B75E", "#A28034", "#5618BA", "#606060"])
plt.rcParams["font.family"] = ["Montserrat", "DejaVu Sans"]   # Montserrat debe estar instalada
```
```python
import plotly.graph_objects as go
import plotly.io as pio

pio.templates["magdalena"] = go.layout.Template(layout=dict(
    colorway=["#0071BB", "#00B7D9", "#69B75E", "#A28034", "#5618BA", "#606060"],
    font=dict(family="Montserrat, Arial, sans-serif", color="#1D1D1B"),
))
pio.templates.default = "plotly_white+magdalena"
```
Serie principal siempre en azul `#0071BB` (reglas de gráficos en el SKILL.md, sección 5).

## Reportes (Excel, PDF)
- openpyxl: encabezados con relleno `0071BB` y texto blanco en negrita; filas alternas `EBF4FA`
  (primary-50).
- ReportLab: `colors.HexColor("#0071BB")`; registra Montserrat como TTF; logo PNG en el encabezado.
- WeasyPrint: plantilla HTML con `magdalena.css` (igual que la web).
