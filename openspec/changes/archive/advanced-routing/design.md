# Design: Advanced Routing Engine (Open Source)

## System Context
Mapia will transition from a local TSP solver to the cloud-based OpenRouteService (ORS) Optimization API (VROOM). Because the project requires a zero-budget open-source solution, live real-time traffic is excluded (as proprietary data is expensive), but we will achieve professional-grade optimization and add custom fuel logic.

## Architecture Changes
1. **Routing Layer (`src/lib/ors.ts`)**: 
   - Expand the existing ORS integration.
   - Add `optimizeRoute(destinations)` which calls the ORS `optimization` endpoint (VROOM) to get the most efficient TSP sequence.
   - Maintain `getDirections(destinations)` to fetch route geometry and base duration for strict manual overrides.
2. **Fuel Estimation (`src/lib/fuel.ts`)**: 
   - Add a utility that takes total distance (km) and a constant (e.g., 8L/100km) to estimate fuel usage.

## Data Models
- **RouteResult**: Update to include `fuelConsumption` (number).

## Component Updates
- **RoutePanel.tsx**: Add UI elements to display fuel consumption (e.g., `⛽ 4.5 L`). Add a disclaimer tooltip that traffic is not included in the open-source tier.
- **App.tsx**: Update `handleOptimize` to use the new `ors.optimizeRoute`. Ensure `reorderDestinations` triggers `ors.getDirections` (strict order) instead of optimizing again.

## API Selection
- **OpenRouteService (ORS)**: Free tier, open-source backbone. No live traffic, but excellent routing and optimization capabilities.
