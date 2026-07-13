# Fix 4 Bugs — Archivo

## Resumen

Cambio completado y verificado: 4 bugs corregidos en la sesión actual.

## Bugs corregidos

| Bug | Archivo | Fix |
|-----|---------|-----|
| Bug 1: Google Maps saltea primer destino | `maps-links.ts` | Eliminado `origin` fijo, primer destino ahora en waypoints |
| Bug 2: Click fantasma crea destinos | `MapView.tsx` | Reforzado interceptor con `.maplibregl-marker-custom` |
| Bug 3: Mapa invisible con 1 pin | `MapView.tsx` | Ya estaba implementado (flyTo para 1 pin) |
| Bug 4: Ruta no se dibuja tras optimizar | `reducer.ts` | Eliminado `route: null` automático en 4 casos del reducer |

## Archivos modificados

- `src/lib/maps-links.ts` — Bug 1
- `src/components/MapView.tsx` — Bug 2 (+ Bug 3 ya presente)
- `src/lib/reducer.ts` — Bug 4
- `src/App.tsx` — Verificado, sin cambios necesarios (Bug 4)

## Verificación

- Build: ✅ Exitoso (Vite 8)
- SC-1 (Google Maps): ✅ PASS
- SC-2 (Click fantasma): ✅ PASS
- SC-3 (1 pin visible): ✅ PASS
- SC-4 (Ruta se dibuja): ✅ PASS
- CRITICAL: 0 | WARNING: 0

## Estado final

4/4 tareas completadas. Cambio archivado.
