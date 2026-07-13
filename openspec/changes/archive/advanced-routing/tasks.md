# Tasks: Advanced Routing Engine (Open Source)

## 1. Infrastructure & Types
- [x] 1.1 Update `src/lib/types.ts` to add `fuelConsumption` (number) to `RouteResult`.
- [x] 1.2 Create `src/lib/fuel.ts` with a function `estimateFuelConsumption(distanceKm: number, efficiencyLitersPer100Km: number = 8)` returning the estimated liters.

## 2. API Integration (OpenRouteService)
- [x] 2.1 Update `src/lib/ors.ts` to include an `optimizeRoute(destinations)` function that calls the ORS Optimization API (`/optimization`) or manually uses the Matrix API to determine the best sequence.
- [x] 2.2 Ensure `getDirections(destinations)` in `ors.ts` fetches the geometry and distance/duration based on the exact provided order.

## 3. State & Logic Updates (App.tsx)
- [x] 3.1 Update `handleOptimize` in `App.tsx` to use the new `ors.optimizeRoute` instead of local `tsp.ts`.
- [x] 3.2 Update `reorderDestinations` in `App.tsx` so that when a user manually drags a destination, it calls `ors.getDirections` (with the new strict order) to update the route without overriding their choice.
- [x] 3.3 Ensure both functions calculate and store the `fuelConsumption` using `src/lib/fuel.ts`.

## 4. UI Updates
- [x] 4.1 Update `src/components/RoutePanel.tsx` to accept the new `RouteResult` properties.
- [x] 4.2 Display the `fuelConsumption` (e.g., "⛽ 4.5 L") in the route panel.
- [x] 4.3 Add a small visual note or tooltip in the UI explaining that duration is standard (no live traffic) due to open-source limitations.

## 5. Cleanup
- [x] 5.1 Remove `src/lib/tsp.ts` (local TSP logic replaced by ORS optimization).
