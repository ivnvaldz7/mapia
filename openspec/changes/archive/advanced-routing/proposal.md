# Proposal: Advanced Routing Engine

## Intent
To upgrade the routing engine to support real-time traffic, fuel consumption estimation, and maintain manual route overrides, providing the user with the most efficient and practical route possible.

## Scope
### In Scope
- Integrate a traffic-aware routing provider (e.g., Google Routes or Mapbox).
- Calculate and display estimated fuel consumption.
- Prioritize distance efficiency (km).
- Allow users to manually override the optimized order.

### Out of Scope
- Turn-by-turn voice navigation.
- Vehicle specific profiles (trucks, motorcycles) for now, defaulting to standard car.

## Capabilities
### New Capabilities
- `advanced-routing`: Live traffic integration, fuel consumption estimation, and high-efficiency waypoint optimization.

### Modified Capabilities
- `route-optimization`: Delegating optimization to a traffic-aware service instead of a local TSP algorithm.
- `destination-management`: Enhancing the drag-and-drop to override the API's suggested order.

## Approach
1. Replace `lib/tsp.ts` and `lib/ors.ts` with a new `lib/routing.ts` that interfaces with a premium routing API (like Mapbox or Google).
2. Calculate fuel consumption using a base formula (e.g., L/100km) multiplied by the total distance, unless the API provides it.
3. Update `RoutePanel` to show traffic delays and fuel cost.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/routing.ts` | New | New API integration |
| `src/lib/ors.ts` | Removed | Replaced by new API |
| `src/lib/tsp.ts` | Removed | Optimization delegated to API |
| `src/components/RoutePanel.tsx` | Modified | Add fuel and traffic UI |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API Cost | High | Implement caching and rate limiting |
| Overrides breaking optimization | Medium | Re-calculate route without optimizing order when manual drag occurs |

## Rollback Plan
Revert to the Git commit before the routing engine replacement and restore `ors.ts` and `tsp.ts`.

## Dependencies
- External API Key for the chosen routing service.

## Success Criteria
- [ ] Route is optimized considering live traffic.
- [ ] Fuel consumption is displayed in the UI.
- [ ] Manual reordering triggers a recalculation maintaining the user's chosen order.
