# Design: Baseline Architecture

## System Context
Mapia is a React SPA that interacts with the OpenRouteService API for geocoding and routing data.

## Architecture
- **State Management**: React `useState` and `useCallback` in `App.tsx` coordinate the global state (destinations, route, loading).
- **Map Rendering**: `MapView` component wraps MapLibre GL.
- **Algorithms**: 
  - `lib/tsp.ts`: Local Traveling Salesperson Problem solver.
  - `lib/ors.ts`: API client for OpenRouteService directions.

## Data Models
- **Destination**: `id`, `name`, `lat`, `lng`.
- **RouteResult**: `orderedDestinations`, `totalDistance`, `totalDuration`, `geometry`, `legs`.

## Components
- `App`: Main container.
- `SearchBar`: Location lookup.
- `DestinationList`: Manages the stops.
- `RoutePanel`: Displays optimization results.
- `MapView`: Renders the map and paths.
