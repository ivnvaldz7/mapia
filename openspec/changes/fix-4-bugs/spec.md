# Fix 4 Bugs — Especificación

## SC-1: Links de navegación sin origin fijo

### Escenario
Usuario con 2+ destinos toca "Abrir Ruta en Maps".

### Comportamiento esperado
- La URL generada NO debe contener `origin`.
- El primer destino debe aparecer como primer waypoint.
- Google Maps debe abrir mostrando la ruta completa desde la ubicación GPS hasta el destino final, pasando por todas las paradas.

### Validación
```typescript
const url = googleMapsLink({ destinations: [a, b, c] })
// url NO contiene 'origin=' (ni explícito como parámetro)
// url contiene 'waypoints=' con a y b
// url contiene 'destination=' con c
```

---

## SC-2: Click en marker no crea destinos fantasma

### Escenario
Usuario clickea un pin existente en el mapa.

### Comportamiento esperado
- No se agrega ningún destino nuevo.
- El marker se selecciona (efecto visual) y el mapa vuela a esa posición.

### Validación
- Click en marker con clase `maplibregl-marker-custom` es ignorado por el handler del mapa.
- Click en wrapper `maplibregl-marker` también es ignorado.

---

## SC-3: Mapa muestra pin con 1 destino

### Escenario
Usuario agrega exactamente 1 destino.

### Comportamiento esperado
- El pin aparece visible en el mapa.
- La cámara hace `flyTo` centrado en ese destino con zoom 15.

### Validación
- `fitBounds` NO se llama cuando hay 1 destino.
- El marker se renderiza y se ve en pantalla.

---

## SC-4: Ruta se dibuja después de optimizar

### Escenario
Usuario aprieta "Optimizar Ruta" con 2+ destinos.

### Comportamiento esperado
- El panel muestra "Calculando…" (loading).
- Al terminar, la polyline se dibuja en el mapa.
- Las métricas (distancia, tiempo, combustible) se muestran en el panel.
- Los destinos se reordenan según la optimización.

### Validación
- `SET_DESTINATIONS` no limpia `route`.
- `SET_ROUTE` se ejecuta después de `SET_DESTINATIONS` en el mismo microtask/batch.
- La polyline persiste después de la optimización.
