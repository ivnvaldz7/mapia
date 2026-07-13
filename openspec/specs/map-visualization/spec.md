# Capability: Map Visualization

## Context
A visual map is required to show the user their selected locations and the calculated path.

## Scenarios

### Scenario: Add destination via map click
- **Given** the user is viewing the map
- **When** they click on a specific point on the map
- **Then** a destination with the clicked coordinates is added to the destination list.

### Scenario: Display route geometry
- **Given** an optimized route has been calculated
- **When** the route geometry is provided to the map
- **Then** the path is drawn connecting the ordered destinations.
