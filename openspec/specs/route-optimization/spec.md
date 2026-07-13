# Capability: Route Optimization

## Context
Calculating the most efficient path through all selected destinations using a TSP algorithm.

## Scenarios

### Scenario: Calculate optimal route
- **Given** the user has 2 or more destinations
- **When** they click "Optimizar"
- **Then** the TSP algorithm calculates the best order
- **And** the OpenRouteService API is called to get distances, duration, and geometry
- **And** the route panel displays the total distance, duration, and individual leg details.
