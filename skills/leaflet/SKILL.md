---
name: leaflet
description: Mapas web con Leaflet (1.9) - capas base, GeoJSON, marcadores y clusters, popups seguros, rendimiento con muchos datos, proyecciones de Colombia (MAGNA-SIRGAS, CTM12), servicios IGAC/DANE e integración con Laravel/Livewire/Filament, React y Angular. Úsalo al crear o modificar cualquier mapa, visor geográfico o funcionalidad con coordenadas.
---

# Leaflet

## Antes de empezar
- Versión: `package.json` → `leaflet` (estable **1.9.x**; la 2.0 está en alpha: no la uses en producción
  sin pedirlo). Plugins: revisa que sean compatibles con esa versión.
- ¿Qué necesita el mapa? Pocos puntos → marcadores. Cientos/miles → cluster o canvas. Polígonos
  pesados (municipios, veredas) → simplificar geometrías. Decenas de miles de features o estilos
  vectoriales → evaluar MapLibre GL con vector tiles.

## Base
```js
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const map = L.map('mapa', { center: [10.4, -74.4], zoom: 8, preferCanvas: true });  // Magdalena aprox.

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
```
- El contenedor **debe tener altura** (`#mapa { height: 480px }` o `h-[60vh]`); sin altura no se ve.
- Si el mapa vive en una pestaña, modal o acordeón, llama `map.invalidateSize()` al mostrarlo.
- Atribución siempre visible (es requisito de licencia de los datos).
- Los tiles de `tile.openstreetmap.org` son para uso ligero (política de uso de OSM). Para tráfico
  real: proveedor con clave (MapTiler, Stadia, Esri...) o servidor propio.

### Íconos con Vite/Webpack
El ícono por defecto se rompe con bundlers. Arreglo estándar:
```js
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
```

## Coordenadas: el error número uno
- **Leaflet usa `[lat, lng]`; GeoJSON usa `[lng, lat]`.** Nunca construyas marcadores leyendo
  `coordinates[0], coordinates[1]` de un GeoJSON sin invertir. Mejor: deja que `L.geoJSON` lo haga.
- Leaflet trabaja en WGS84 (EPSG:4326) y muestra en Web Mercator (EPSG:3857).
- **Colombia**: datos oficiales suelen venir en MAGNA-SIRGAS (EPSG:4686, prácticamente igual a 4326)
  o en **Origen Nacional / CTM12 (EPSG:9377)**, en metros. Datos en 9377 (o en orígenes antiguos
  Bogotá/Este/Oeste) **hay que reproyectarlos** a 4326 antes de usarlos: en el backend (PostGIS
  `ST_Transform(geom, 4326)`), con `ogr2ogr`/mapshaper, o con `proj4` en el navegador.
  ```js
  import proj4 from 'proj4';
  proj4.defs('EPSG:9377', '+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
  const [lng, lat] = proj4('EPSG:9377', 'EPSG:4326', [este, norte]);   // devuelve [lng, lat]
  ```
- Si un punto aparece en el océano o en África: lat/lng invertidos o falta reproyección.

## GeoJSON, estilos e interacción
```js
const capa = L.geoJSON(municipios, {
  style: (f) => ({ color: '#0071BB', weight: 1, fillOpacity: f.properties.activo ? 0.35 : 0.1 }),
  onEachFeature: (f, layer) => {
    layer.bindPopup(() => popupMunicipio(f.properties));      // contenido seguro (ver abajo)
    layer.on({ mouseover: (e) => e.target.setStyle({ weight: 3 }), mouseout: (e) => capa.resetStyle(e.target) });
  },
}).addTo(map);
map.fitBounds(capa.getBounds(), { padding: [20, 20] });

L.control.layers({ 'Calles': base }, { 'Municipios': capa }).addTo(map);
L.control.scale({ imperial: false }).addTo(map);
```
- Coropletas: escala de colores con pocas clases (5-7), leyenda visible y con unidades.
- Colores de marca si aplica (skill `marca-magdalena`): azul institucional para lo principal.

## Popups seguros (XSS)
`bindPopup('<b>' + nombre + '</b>')` con datos de usuario o de BD es una inyección de HTML. Construye
nodos o escapa:
```js
function popupMunicipio(p) {
  const div = L.DomUtil.create('div');
  const h = L.DomUtil.create('strong', '', div);
  h.textContent = p.nombre;                 // textContent, nunca innerHTML con datos
  L.DomUtil.create('div', '', div).textContent = `Población: ${p.poblacion.toLocaleString('es-CO')}`;
  return div;
}
```

## Rendimiento
- Muchos puntos: `leaflet.markercluster` o `L.circleMarker` + `preferCanvas: true`.
- Polígonos: simplifica (mapshaper `-simplify 10%`, `@turf/simplify`) y reduce decimales a 5-6.
- Carga por vista: pide al backend solo lo visible (`map.getBounds()` → `?bbox=minLng,minLat,maxLng,maxLat`)
  con debounce en `moveend`.
- No recrees capas en cada cambio de filtro: `capa.clearLayers(); capa.addData(nuevos)`.

## Servicios oficiales (Colombia)
- **IGAC** publica servicios WMS/WMTS (cartografía base, límites): `L.tileLayer.wms(url, { layers, format: 'image/png', transparent: true })`.
  Verifica la URL y las capas vigentes en el geoportal del IGAC antes de usarlas.
- **DANE – Marco Geoestadístico Nacional (MGN)**: límites de departamentos, municipios, sectores. Código
  DANE de municipio = 5 dígitos (texto, con cero a la izquierda).
- Geocodificación con Nominatim: máx. 1 petición/segundo, sin uso masivo, con identificación; para
  producción usar un servicio propio o comercial y **cachear** resultados.

## Backend geográfico
- PostgreSQL + **PostGIS**: `geometry(Point, 4326)`, índice GiST, `ST_AsGeoJSON`, `ST_Intersects` para
  bbox. MySQL: tipos espaciales con SRID e índice `SPATIAL`. MongoDB: GeoJSON + índice `2dsphere`.
- La API devuelve `FeatureCollection` GeoJSON con solo las propiedades necesarias.

## Integración por framework
- **Blade / Livewire / Filament**: el contenedor del mapa con **`wire:ignore`** (si no, Livewire lo
  destruye en cada render). Inicializa con Alpine:
  ```blade
  <div wire:ignore x-data x-init="initMapa($el, @js($puntos))" class="h-96 rounded-lg"></div>
  ```
  Actualiza datos con eventos (`$wire.on('puntos-actualizados', ...)`), no re-renderizando el div.
  En Filament: widget o campo personalizado con la misma técnica.
- **React**: crea el mapa en un `useEffect` con `ref` y **`map.remove()` en el cleanup** (si no, "Map
  container is already initialized"). `react-leaflet` 5 requiere React 19 y usa la licencia
  **Hippocratic 2.1** (no es una licencia open source estándar): consúltalo antes de usarla en
  proyectos públicos; Leaflet directo con hooks es una alternativa sin ese tema.
- **Angular**: crea el mapa en `ngAfterViewInit`, destrúyelo en `ngOnDestroy`; con zone.js, ejecuta la
  inicialización fuera de la zona (`NgZone.runOutsideAngular`) para no disparar detección de cambios
  en cada movimiento.

## Accesibilidad
- El mapa no puede ser la única forma de acceder a la información: acompáñalo de una lista o tabla
  (y búsqueda) con los mismos datos.
- Marcadores con `title`/`alt` descriptivos; controles operables con teclado; contraste en estilos.

## Errores frecuentes de agentes
- Contenedor sin altura; olvidar el CSS de Leaflet; íconos rotos con Vite.
- lat/lng invertidos; usar datos en EPSG:9377 sin reproyectar.
- Popups con HTML concatenado (XSS).
- Mapa dentro de Livewire sin `wire:ignore`; en React sin `map.remove()`.
- Usar tiles de OSM o Nominatim de forma masiva en producción.

## Verificación
- El mapa carga, encuadra (`fitBounds`) y la atribución se ve; funciona en móvil (zoom con gestos).
- Un punto conocido (p. ej. la Gobernación en Santa Marta) cae donde debe.
- Probar con el volumen real de datos y revisar fluidez al hacer zoom/pan.
