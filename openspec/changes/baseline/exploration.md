## Exploration: Baseline

### Current State
Mapia is a route optimizer web application. It allows users to add multiple destinations via search or map clicks, reorder them manually, and calculate an optimal route using a TSP algorithm and OpenRouteService (ORS) for directions.

### Affected Areas
- `src/App.tsx` — Core state and layout.
- `src/components/` — UI components (`MapView`, `SearchBar`, `DestinationList`, `RoutePanel`).
- `src/lib/` — Logic and API integrations (`tsp.ts`, `ors.ts`, `constants.ts`).

### Approaches
1. **Reverse Engineer Specs** — Document the existing functionality into SDD specs to serve as a baseline for future changes.
   - Effort: Low

### Recommendation
Reverse engineer the current state into a baseline spec.

### Risks
- Undocumented edge cases might be missed.

### Ready for Proposal
Yes
