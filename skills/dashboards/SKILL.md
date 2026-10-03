---
name: dashboards
description: Dashboards y gráficos profesionales con librerías libres - estructura de un tablero (KPIs, tendencias, detalle), elección de gráfico, color y accesibilidad, formato es-CO, rendimiento con muchos datos, licencias (qué es libre y qué no) e integración con Filament, Laravel/Blade, React, Angular, Python y la marca de la Gobernación. Úsalo al crear o mejorar cualquier dashboard, reporte visual, KPI o gráfico.
---

# Dashboards profesionales

Complementos (si están instalados): `dataviz-selector` (qué gráfico), `dataviz-color` (color),
`dataviz-precision` (decimales), `dataviz-critique` (revisión), `build-dashboard` (dashboard HTML
autocontenido), `data-visualization` / `explore-data` / `validate-data` (Python y validación de
análisis), `leaflet` (mapas), `marca-magdalena` (identidad visual).

## 1. Licencias: usa solo librerías libres
| Librería | Licencia | Úsala para |
|---|---|---|
| **Apache ECharts** 6 | Apache-2.0 ✅ | dashboards ricos, muchos datos, mapas, interacción (opción por defecto) |
| **Chart.js** 4 | MIT ✅ | gráficos sencillos y livianos; es lo que usa **Filament** |
| **Recharts** / gráficos de **shadcn/ui** | MIT ✅ | React |
| **Tremor** | Apache-2.0 ✅ | React + Tailwind, tableros rápidos |
| **AG Charts / AG Grid Community** | MIT ✅ | gráficos financieros y **tablas** de datos grandes (las ediciones *Enterprise* son de pago) |
| **D3** / **Observable Plot** | ISC ✅ | visualizaciones a medida |
| **uPlot** | MIT ✅ | series de tiempo con cientos de miles de puntos |
| **Plotly** (JS/Python), **Dash** | MIT ✅ | análisis interactivo, ciencia de datos |
| **Vega-Lite** | BSD-3 ✅ | gráficos declarativos desde especificaciones JSON |
| ❌ **ApexCharts 6+** | doble licencia: gratis solo para organizaciones con < USD 2M de ingresos/presupuesto | **no** para entidades públicas ni empresas medianas sin licencia (afecta plugins como `filament-apexcharts`) |
| ❌ **Highcharts** | comercial (gratis solo uso no comercial) | no, salvo licencia comprada |

Antes de agregar cualquier otra librería, verifica su licencia (`npm view <pkg> license`) y repórtala al
usuario. No actualices una librería si la nueva versión cambió de licencia.

## 2. Estructura de un buen dashboard
1. **Pregunta**: ¿qué decisión toma quien lo mira? Un dashboard sin pregunta es un muro de gráficos.
2. **Jerarquía en Z**: arriba 3-6 **KPIs** (número grande + comparación con periodo anterior o meta +
   mini tendencia); al medio **tendencias** y **comparaciones**; abajo el **detalle** (tabla filtrable).
3. **Filtros globales** visibles arriba (periodo, dependencia, municipio) que afectan a todo; indica
   siempre el periodo y la fecha de corte de los datos ("Datos al 30/09/2026").
4. Máximo ~6-8 visualizaciones por vista; lo demás en pestañas o páginas de detalle.
5. Cada gráfico con **título que dice la conclusión** ("Los trámites en línea crecieron 18% en el
   trimestre") y subtítulo con la métrica y unidad.

## 3. Elegir el gráfico
| Pregunta | Gráfico |
|---|---|
| ¿Cómo cambia en el tiempo? | líneas (área si es volumen acumulado) |
| ¿Cómo se comparan categorías? | barras horizontales ordenadas de mayor a menor |
| ¿Qué parte del total? | barra apilada 100% o, con ≤ 4 partes, dona; nunca torta con 8 porciones |
| ¿Cómo se distribuye? | histograma, boxplot |
| ¿Hay relación entre dos variables? | dispersión |
| ¿Dónde ocurre? | mapa coroplético (ECharts o Leaflet) |
| ¿Avance contra meta? | barra de progreso o *bullet chart* (evita velocímetros) |
| ¿Valor exacto por fila? | tabla (con barras dentro de la celda si ayuda) |
- Ejes de barras **empiezan en cero**. Sin 3D, sin sombras decorativas, sin doble eje Y salvo que sea
  imprescindible (y entonces con colores que identifiquen cada eje).

## 4. Color, texto y accesibilidad
- **Un color principal** para lo importante y grises para el contexto; los acentos solo para resaltar
  (alerta, meta no cumplida). En proyectos de la Gobernación: azul institucional `#0071BB` como serie
  principal y la escala `--mg-primary-*` para secuenciales (skill `marca-magdalena`).
- Categóricos: máximo ~6-8 colores distinguibles; más categorías → agrupar en "Otros" o usar facetas.
- Secuencial (de claro a oscuro) para magnitudes; divergente (dos colores + neutro) para valores
  alrededor de una referencia.
- No comuniques **solo** con color: etiquetas directas, patrones o íconos; contraste ≥ 3:1 para
  elementos gráficos y 4.5:1 para texto (WCAG 2.2).
- Etiqueta las series directamente en lugar de leyendas lejanas cuando sea posible.
- Ofrece la **tabla de datos** o descarga CSV como alternativa accesible; `aria-label` o descripción
  del gráfico con la conclusión.
- Modo oscuro: redefine la paleta, no inviertas colores sin revisar el contraste.

## 5. Números en español de Colombia
```js
const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const compacto = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }); // 1,2 mil M
const porcentaje = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });
const fecha = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
```
- Separador decimal coma y de miles punto; "mil millones" (no "billones" en el sentido inglés).
- Precisión según la decisión (skill `dataviz-precision`): KPIs con 0-1 decimales; nada de `12.3456%`.
- Variación siempre con signo y referencia: "+12,4 % vs. sep. 2025".

## 6. Rendimiento
- Agrega en el servidor (SQL `GROUP BY`, vistas materializadas, tablas de resumen) y envía al
  navegador solo lo que se dibuja; nunca miles de filas crudas para hacer un gráfico de 12 barras.
- Cachea consultas costosas (minutos u horas según la frescura necesaria) e indica la hora de corte.
- Muchos puntos: ECharts con `sampling: 'lttb'` y `large: true`, o uPlot; tablas grandes con
  paginación del servidor o virtualización (AG Grid Community).
- Carga diferida de gráficos fuera de pantalla y de la librería (`import()` dinámico).
- Redimensiona al cambiar el contenedor (`ResizeObserver` / `chart.resize()`); destruye instancias al
  desmontar.

## 7. Integración por stack
**Filament** (Chart.js incluido): `php artisan make:filament-widget VentasChart --chart`; widgets de
estadísticas con `StatsOverviewWidget` (`Stat::make(...)->description(...)->chart([...])`), filtros
del dashboard con `HasFiltersForm`/`InteractsWithPageFilters`, `$pollingInterval` solo si hace falta
tiempo real. Para ECharts en Filament: widget personalizado con vista Blade y `wire:ignore`.

**Laravel + Blade + ECharts**:
```blade
<div wire:ignore x-data x-init="
    const chart = echarts.init($el, null, { renderer: 'canvas' });
    chart.setOption(@js($opciones));
    new ResizeObserver(() => chart.resize()).observe($el);
" class="h-80 w-full" role="img" aria-label="{{ $conclusion }}"></div>
```
Construye las opciones (`$opciones`) en PHP desde datos ya agregados.

**React**: Recharts o los charts de shadcn/ui (Tailwind) o Tremor para tableros; `echarts-for-react`
cuando se necesite ECharts. Gráficos en componentes cliente; datos desde el servidor (Server
Components en Next.js).

**Angular**: `ngx-echarts` (MIT) con `provideEchartsCore({ echarts: () => import('echarts') })`;
signals para filtros; destruir en `ngOnDestroy`.

**Python**: Plotly/Dash o Streamlit (Apache-2.0) para tableros internos de análisis; para reportes
estáticos, matplotlib/seaborn (skill `data-visualization`).

**Dashboard HTML autocontenido** (para enviar o publicar sin servidor): skill `build-dashboard`.

## 8. Diseño visual "pro"
- Rejilla de 12 columnas con espacios consistentes (múltiplos de 8 px); tarjetas con el mismo alto por
  fila; bordes sutiles en vez de sombras fuertes.
- Tipografía: números tabulares (`font-variant-numeric: tabular-nums`) para que las cifras se alineen.
- Estados vacíos, de carga (skeleton) y de error diseñados, no solo el caso feliz.
- Responsive: en móvil, KPIs en 2 columnas y gráficos apilados a ancho completo; tablas con scroll
  horizontal o vista en tarjetas.
- Exportar: CSV/Excel de los datos del gráfico; PDF o imagen solo si el usuario lo pide.

## Errores frecuentes de agentes
- Instalar ApexCharts o Highcharts en proyectos sin licencia.
- Tortas con muchas porciones, 3D, ejes que no empiezan en cero, arcoíris de colores.
- Mandar datos crudos al navegador y agregarlos en JavaScript.
- Números sin formato local, sin unidad o sin periodo de referencia.
- Gráficos que no se redimensionan, que se duplican al re-renderizar (Livewire sin `wire:ignore`) o
  que no se destruyen al salir de la vista.

## Verificación
- Cada gráfico responde una pregunta y su título la dice.
- Datos cuadran contra la fuente (skill `validate-data`): totales, filtros y periodo.
- Se ve bien en 360 px, 1280 px y en modo oscuro si aplica; navegable con teclado; tabla alternativa.
- Tiempo de carga razonable con el volumen real de datos.
