## Exploration: Advanced Routing Engine

### Current State
Mapia currently optimizes routes using a local TSP algorithm and fetches static directions via OpenRouteService (ORS). It allows manual reordering of stops. It does not account for real-time traffic or fuel consumption.

### Affected Areas
- `src/lib/ors.ts` — Currently handles static directions.
- `src/lib/tsp.ts` — Local TSP logic.
- `src/App.tsx` & `src/components/RoutePanel.tsx` — UI for displaying route details.
- `src/components/DestinationList.tsx` — UI for reordering (already supports manual override).

### Approaches
1. **Enhance ORS + Custom Fuel Logic**
   - Pros: Keeps existing API.
   - Cons: Free ORS doesn't support real-time traffic. Fuel calculation would be a static formula based on distance.
   - Effort: Medium
2. **Migrate to Google Routes API or Mapbox Directions API**
   - Pros: Native support for real-time traffic, highly accurate TSP (via waypoint optimization), and some support for fuel/eco routing.
   - Cons: Requires API keys and replacing the routing/TSP engine.
   - Effort: High

### Recommendation
Migrate the routing engine to an API that natively supports waypoint optimization, live traffic, and route modifiers (like Google Routes API or Mapbox). This replaces the local TSP and ORS with a single, robust call. Add a fuel consumption estimation layer.

### Risks
- API Rate limits and pricing.
- Complete rewrite of the routing logic.

### Ready for Proposal
Yes
