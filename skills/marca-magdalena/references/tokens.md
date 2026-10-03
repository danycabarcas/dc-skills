# Tokens · Marca Magdalena

> Generado desde `dist/tokens/magdalena-tokens.json` (v1.0.0) del kit manual_de_marca. Variables CSS: `--mg-<nombre>`.

## Colores base

| Nombre | HEX | RGB | CMYK | Rol |
|---|---|---|---|---|
| primary | `#0071BB` | 0, 113, 187 | 87, 49, 0, 0 | Azul institucional (PRIMARIO) |
| cyan | `#00B7D9` | 0, 183, 217 | 72, 0, 13, 0 | Cian (PRIMARIO – final del degradado) |
| sky | `#9FD7E5` | 159, 215, 229 | 41, 0, 11, 0 | Celeste (PRIMARIO – fondos suaves) |
| red | `#F7003C` | 247, 0, 60 | 0, 96, 66, 0 | Rojo (PRIMARIO – acentos / alertas) |
| yellow | `#FEC800` | 254, 200, 0 | 0, 23, 93, 0 | Amarillo (acento) |
| green | `#69B75E` | 105, 183, 94 | 63, 0, 78, 0 | Verde (acento / éxito) |
| olive | `#A28034` | 162, 128, 52 | 30, 41, 85, 21 | Ocre (acento) |
| purple | `#5618BA` | 86, 24, 186 | 80, 89, 0, 0 | Violeta (acento – extremos de la franja) |

Neutros: ink `#1D1D1B` · gray `#606060` · surface `#F6F5F5` · white `#FFFFFF`

## Escalas (`--mg-<color>-<tono>`)

| Color | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| primary | `#EBF4FA` | `#D6E8F4` | `#ADD2E9` | `#80B8DD` | `#4094CC` | `#0071BB` | `#0061A1` | `#004F83` | `#003D65` | `#002B47` | `#001B2D` |
| cyan | `#EBF9FC` | `#D6F3F9` | `#ADE8F3` | `#80DBEC` | `#40C9E2` | `#00B7D9` | `#009DBB` | `#008098` | `#006375` | `#004652` | `#002C34` |
| sky | `#F7FCFD` | `#F0F9FB` | `#E0F2F7` | `#CFEBF2` | `#B7E1EC` | `#9FD7E5` | `#89B9C5` | `#6F96A0` | `#56747C` | `#3C5257` | `#263437` |
| red | `#FEEBEF` | `#FED6E0` | `#FCADC1` | `#FB809E` | `#F9406D` | `#F7003C` | `#D40034` | `#AD002A` | `#850020` | `#5E0017` | `#3B000E` |
| yellow | `#FFFBEB` | `#FFF6D6` | `#FFEDAD` | `#FEE480` | `#FED640` | `#FEC800` | `#DAAC00` | `#B28C00` | `#896C00` | `#614C00` | `#3D3000` |
| green | `#F3F9F2` | `#E7F3E5` | `#CFE8CB` | `#B4DBAE` | `#8EC986` | `#69B75E` | `#5A9D51` | `#4A8042` | `#396333` | `#284624` | `#192C17` |
| olive | `#F8F5EF` | `#F0EBDF` | `#E1D6BE` | `#D0C09A` | `#B9A067` | `#A28034` | `#8B6E2D` | `#715A24` | `#57451C` | `#3E3114` | `#271F0C` |
| purple | `#F1EDF9` | `#E4DAF4` | `#C9B5E9` | `#AA8CDC` | `#8052CB` | `#5618BA` | `#4A15A0` | `#3C1182` | `#2E0D64` | `#210947` | `#15062D` |
| gray | `#F8FAFC` | `#F1F4F8` | `#E3E8EF` | `#CBD2DC` | `#97A1B0` | `#6B7482` | `#4F5866` | `#3A424F` | `#252B36` | `#161A22` | `#0C0F14` |
| navy | — | — | — | — | — | — | `#12395C` | `#0E2D49` | `#0B2239` | `#081A2C` | `#051220` |

`gray` es el gris azulado de la interfaz (bordes, fondos); `navy` es el azul-noche de sidebars, hero y cabeceras oscuras.

## Semánticos

| Rol | HEX |
|---|---|
| primary | `#0071BB` |
| secondary | `#606060` |
| info | `#00B7D9` |
| success | `#69B75E` |
| warning | `#FEC800` |
| danger | `#F7003C` |

## La línea (orden de franjas)

`#5618BA` → `#A28034` → `#FEC800` → `#F7003C` → `#0071BB` → `#00B7D9` → `#9FD7E5` → `#69B75E` → `#5618BA`

## Degradados (`--mg-gradient-<nombre>`)

| Nombre | Valor |
|---|---|
| primary | `linear-gradient(135deg, #0071BB 0%, #00B7D9 100%)` |
| primary-h | `linear-gradient(90deg, #0071BB 0%, #00B7D9 100%)` |
| primary-v | `linear-gradient(180deg, #0071BB 0%, #00B7D9 100%)` |
| sky | `linear-gradient(135deg, #0071BB 0%, #00B7D9 55%, #9FD7E5 100%)` |
| sky-h | `linear-gradient(90deg, #0071BB 0%, #00B7D9 55%, #9FD7E5 100%)` |
| aqua | `linear-gradient(135deg, #00B7D9 0%, #9FD7E5 100%)` |
| mist | `linear-gradient(180deg, #9FD7E5 0%, #EAF6FA 100%)` |
| deep | `linear-gradient(180deg, #081A2C 0%, #051220 100%)` |
| night | `linear-gradient(135deg, #0B2239 0%, #051220 100%)` |
| steel | `linear-gradient(180deg, #147CC0 0%, #0071BB 100%)` |
| action | `linear-gradient(180deg, #147CC0 0%, #0071BB 100%)` |
| action-aa | `linear-gradient(180deg, #147CC0 0%, #0071BB 100%)` |
| tropical | `linear-gradient(135deg, #00B7D9 0%, #69B75E 100%)` |
| sun | `linear-gradient(135deg, #FEC800 0%, #DAAC00 100%)` |
| heat | `linear-gradient(135deg, #F7003C 0%, #AD002A 100%)` |
| earth | `linear-gradient(135deg, #A28034 0%, #715A24 100%)` |
| violet | `linear-gradient(135deg, #5618BA 0%, #0071BB 100%)` |
| stripe | `linear-gradient(90deg, #5618BA 0.0% 11.111%, #A28034 11.111% 22.222%, #FEC800 22.222% 33.333%, #F7003C 33.333% 44.444%, #0071BB 44.444% 55.556%, #00B7D9 55.556% 66.667%, #9FD7E5 66.667% 77.778%, #69B75E 77.778% 88.889%, #5618BA 88.889% 100.0%)` |
| stripe-v | `linear-gradient(180deg, #5618BA 0.0% 11.111%, #A28034 11.111% 22.222%, #FEC800 22.222% 33.333%, #F7003C 33.333% 44.444%, #0071BB 44.444% 55.556%, #00B7D9 55.556% 66.667%, #9FD7E5 66.667% 77.778%, #69B75E 77.778% 88.889%, #5618BA 88.889% 100.0%)` |
| stripe-flow | `linear-gradient(90deg, #5618BA, #A28034, #FEC800, #F7003C, #0071BB, #00B7D9, #9FD7E5, #69B75E, #5618BA)` |

Uso: `primary`/`sky` en portadas; `action`/`steel` en el botón principal; `night`/`deep` en fondos oscuros; `stripe` para la línea. Los demás (`sun`, `heat`, `earth`, `tropical`, `violet`) solo en piezas de campaña.

## Tipografía

- `--mg-font-sans`: `'Montserrat', 'Gotham', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`
- `--mg-font-display`: `'Montserrat', 'Gotham', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`
- `--mg-font-mono`: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
- Google Fonts: https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap

## Radios (`--mg-radius-*`)

sm `4px` · md `8px` · lg `12px` · xl `16px` · pill `999px`

## Sombras (`--mg-shadow-*`)

- sm: `0 1px 2px rgba(8,26,44,.06)`
- md: `0 2px 6px rgba(8,26,44,.08), 0 1px 2px rgba(8,26,44,.05)`
- lg: `0 12px 28px rgba(8,26,44,.14), 0 2px 6px rgba(8,26,44,.06)`
- glow: `0 0 0 3px rgba(0,113,187,.22)`

## Variables de interfaz (en `magdalena-tokens.css`)

`--mg-bg`, `--mg-bg-app`, `--mg-surface`, `--mg-surface-card`, `--mg-text`, `--mg-text-muted`, `--mg-heading`, `--mg-border`, `--mg-border-strong`, `--mg-color-{primary,secondary,info,success,warning,danger}`, `--mg-on-{primary,secondary,info,success,warning,danger}` (color de texto encima), `--mg-sidebar-{bg,text,text-active,hover,active,accent}`, `--mg-glass-{bg,bg-dark,border,border-dark,blur}`, y `--mg-<color>-rgb` para usar con `rgb(var(--mg-primary-rgb) / .2)`.
