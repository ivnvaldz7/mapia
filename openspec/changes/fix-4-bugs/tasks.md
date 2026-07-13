# Fix 4 Bugs — Tareas de Implementación

## T1: maps-links.ts — Sacar origin fijo en multi-destino

**Archivo**: `src/lib/maps-links.ts`
**Scope**: Líneas 23-37 (caso multi-destino de `googleMapsLink`)
**Cambio**: Eliminar `params.set('origin', ...)` y agregar `destinations[0]` a waypoints.
**Riesgo**: Bajo — cambio localizado en una función de generación de URLs.
**Estado**: ✅ Completado

## T2: MapView.tsx — Reforzar interceptor de clicks en markers

**Archivo**: `src/components/MapView.tsx`
**Scope**: Línea 53
**Cambio**: Agregar `target.closest('.maplibregl-marker-custom')` al condicional.
**Riesgo**: Bajo — cambio de una línea.
**Estado**: ✅ Completado

## T3: reducer.ts — No limpiar route automáticamente

**Archivo**: `src/lib/reducer.ts`
**Scope**: Casos `ADD_DESTINATION`, `SET_DESTINATIONS`, `TOGGLE_PIN`, `REMOVE_DESTINATION`
**Cambio**: Eliminar `route: null` de estos casos en el reducer.
**Riesgo**: Medio — afecta el flujo de estado global.
**Estado**: ✅ Completado

## T4: App.tsx — Ajustar removeDestination

**Archivo**: `src/App.tsx`
**Scope**: Función `removeDestination`
**Cambio**: Verificar que el flujo explícito de `SET_ROUTE null` ya funciona (sin cambios necesarios).
**Riesgo**: Bajo — acompañamiento del cambio en reducer.
**Estado**: ✅ Verificado, sin cambios necesarios

---

### Review Workload Forecast

- **Archivos modificados**: 4
- **Líneas cambiadas estimadas**: ~30-50
- **Chained PRs recomendadas**: No
- **400-line budget risk**: Bajo
