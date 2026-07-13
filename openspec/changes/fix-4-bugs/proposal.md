# Fix 4 Bugs — Propuesta

## Problemas a resolver

### Bug 1: Google Maps mobile saltea primer destino
- **Causa**: `maps-links.ts` envía `origin` fijo en rutas multi-destino, causando que Google Maps ignore el primer destino como waypoint.
- **Fix**: Sacar `origin`, mandar todos los destinos como waypoints + destination.

### Bug 2: Click fantasma crea destinos no deseados
- **Causa**: El interceptor de clicks en `MapView.tsx` busca `.maplibregl-marker` pero el click puede caer directo en el elemento con clase `maplibregl-marker-custom`.
- **Fix**: Agregar `maplibregl-marker-custom` al check del interceptor.

### Bug 3: Mapa invisible con 1 pin
- **Causa**: `fitBounds` con rectángulo 0x0 colapsa MapLibre.
- **Fix**: Ya implementado en el working tree (`MapView.tsx:99-104`), verificar que esté correcto.

### Bug 4: Ruta no se dibuja tras optimizar
- **Causa**: El reducer limpia `route: null` en `SET_DESTINATIONS`, `ADD_DESTINATION`, y `TOGGLE_PIN`, causando que la polyline desaparezca.
- **Fix**: Que el reducer no limpie `route` automáticamente; que `handleOptimize` controle el ciclo de vida de la ruta.

## Archivos a modificar

- `src/lib/maps-links.ts` — Bug 1
- `src/components/MapView.tsx` — Bug 2, verificar Bug 3
- `src/lib/reducer.ts` — Bug 4
- `src/App.tsx` — Bug 4 (asegurar flujo correcto)
