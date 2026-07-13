# Fix 4 Bugs — Diseño Técnico

## D1: Refactor de maps-links.ts (Bug 1)

### Actual
```typescript
const origin = destinations[0]
const lastStop = destinations[destinations.length - 1]
const waypoints = destinations.slice(1, -1)
params.set('origin', latlng(origin))
params.set('destination', latlng(lastStop))
params.set('waypoints', waypoints.map(latlng).join('|'))
```

### Nuevo
```typescript
const lastStop = destinations[destinations.length - 1]
const waypoints = destinations.slice(0, -1) // todos menos el último
params.set('destination', latlng(lastStop))
if (waypoints.length > 0) {
  params.set('waypoints', waypoints.map(latlng).join('|'))
}
```

**Razonamiento**: Google Maps usa tu ubicación GPS como origen cuando `origin` no está presente. Al mover el primer destino a waypoints, la navegación GPS te lleva desde donde estás → pin 1 → pin 2 → ... → destino final.

---

## D2: Reforzar interceptor de clicks (Bug 2)

### Actual
```typescript
if (target.closest('.maplibregl-marker') || target.dataset.id) {
  return
}
```

### Nuevo
```typescript
if (
  target.closest('.maplibregl-marker') ||
  target.closest('.maplibregl-marker-custom') ||
  target.dataset.id
) {
  return
}
```

**Razonamiento**: MapLibre asigna `.maplibregl-marker` al wrapper, pero el target del evento puede ser el elemento interno con clase `.maplibregl-marker-custom`. Agregar la clase custom al closest cubre ambos casos aunque el wrapper no esté en la cadena de herencia.

---

## D3: Reducer no debe limpiar route (Bug 4)

### Reducer — cambios

| Acción | Antes | Después |
|--------|-------|---------|
| `ADD_DESTINATION` | `route: null` | **Sin cambio de route** |
| `SET_DESTINATIONS` | `route: null` | **Sin cambio de route** |
| `TOGGLE_PIN` | `route: null` | **Sin cambio de route** |
| `REMOVE_DESTINATION` | `route: null` | **Sin cambio de route** |

**Razonamiento**: El reducer no debe tener side effects de limpiar ruta. Quien debe controlar el ciclo de vida de `route` es `handleOptimize` y `removeDestination` explícitamente.

### App.tsx — flujo handleOptimize

El flujo actual ya está bien:
1. `dispatch({ type: 'SET_ROUTE', payload: null })` — limpia ruta explícitamente
2. Calcula async
3. `dispatch({ type: 'SET_DESTINATIONS', payload: ... })` — actualiza destinos (sin limpiar route)
4. `dispatch({ type: 'SET_ROUTE', payload: ... })` — setea ruta

React 19 batching asegura que 3+4 se rendericen juntos en un solo frame.

---

## D4: Ajuste en removeDestination (Bug 4 refuerzo)

Actualmente `removeDestination` hace:
```typescript
dispatch({ type: 'SET_DESTINATIONS', payload: remaining })
if (!state.route || remaining.length < 2) {
  dispatch({ type: 'SET_ROUTE', payload: null })
  return
}
handleOptimize(remaining)
```

Con el cambio en el reducer, `SET_DESTINATIONS` ya no limpia route. Entonces `removeDestination` debe limpiar route explícitamente cuando `remaining.length < 2` (sigue funcionando, pero ahora es explícito en vez de implícito).
