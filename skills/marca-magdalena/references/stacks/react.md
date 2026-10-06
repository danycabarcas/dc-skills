# React / Next.js (MUI)

## CSS global
```jsx
// src/main.jsx (Vite)
import './styles/magdalena.min.css';     // copiado de dist/css/
```
```tsx
// app/layout.tsx (Next.js)
import '../styles/magdalena.min.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className="mg-base">{children}</body></html>;
}
```
Usa `className="mg-card"`, `mg-btn`, etc. (ver [../componentes.md](../componentes.md)) o Tailwind
([tailwind.md](tailwind.md)).

## Material UI (MUI)
```jsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import magdalenaTheme from './magdalena-mui-theme.mjs';   // dist/mui/ (incluye magdalena-tokens.mjs)

<ThemeProvider theme={magdalenaTheme}><CssBaseline /><App /></ThemeProvider>
```

## Tokens en JS/TS
`import tokens from './magdalena-tokens.mjs'` (`dist/tokens/`, con tipos `.d.ts`) para colores de
gráficos (Recharts, ECharts) y estilos en línea: serie principal `tokens.colors.primary.hex`.
