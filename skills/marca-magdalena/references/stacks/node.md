# Node.js (servidores, bundlers, correos y PDFs)

## Servir la marca
```js
import express from 'express';

const app = express();
app.use('/brand', express.static('manual_de_marca'));   // → /brand/dist/css/magdalena.min.css
```
En plantillas (EJS, Handlebars, Pug): `<link rel="stylesheet" href="/brand/dist/css/magdalena.min.css">`.

## Bundlers (Vite, Webpack, esbuild)
```js
import './styles/magdalena.min.css';
import tokens from './magdalena-tokens.mjs';   // dist/tokens/
tokens.colors.primary.hex;                     // "#0071BB"
```
Sass: `@use 'magdalena-tokens' as *;` (`dist/scss/_magdalena-tokens.scss`).

## Correos HTML (Nodemailer, plantillas)
- Estilos **en línea** y maquetación con tablas; muchos clientes ignoran `<style>` y las variables CSS.
- Logo en **PNG** con URL absoluta (`BASE/assets/logos/png/logo-horizontal-color.png`), `width`/`height`
  fijos y `alt`; varios clientes no muestran SVG.
- Colores en hex de la paleta; fuente `Montserrat, Arial, sans-serif` (la mayoría mostrará Arial).
- La línea: una tabla de 9 celdas de 3 px de alto con los colores en orden, o la imagen
  `barra-franjas.png`.

## PDFs
- HTML → PDF (Puppeteer/Playwright): renderiza una plantilla que cargue `magdalena.css` y Montserrat
  (local, para no depender de internet en el servidor).
- Generación directa (pdfmake, PDFKit): registra Montserrat y usa los hex de la paleta.
