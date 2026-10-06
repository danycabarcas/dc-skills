# Móvil (Android, Flutter, iOS)

## Android
Copia `dist/tokens/android-colors.xml` a `app/src/main/res/values/magdalena_colors.xml`. En Material 3
(Compose) usa esos valores para `primary` (`#0071BB`) y para los colores de error/éxito/aviso.

## Flutter
```dart
// copie dist/tokens/flutter_magdalena_colors.dart a lib/theme/
import 'theme/flutter_magdalena_colors.dart';

ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: MagdalenaColors.primary), fontFamily: 'Montserrat');
```
`fromSeed` genera una paleta Material a partir del azul; si algún color debe ser exacto, asígnalo
explícitamente en el `ColorScheme`.

## iOS / otros
Genera el asset catalog a partir de `dist/tokens/magdalena-tokens.json` (hex y RGB).

## En todas las plataformas
- Ícono de la app y splash: escudo (`assets/logos/png/escudo.png`) o `assets/favicon/icon-512.png`;
  el logo completo solo donde haya espacio.
- Incluye Montserrat como fuente de la app (licencia libre) en vez de depender del sistema.
