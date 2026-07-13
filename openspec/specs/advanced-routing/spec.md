# Capability: Advanced Routing

## Context
Users need routes optimized not just by distance, but by real-time traffic, and they need to know the fuel consumption.

## Scenarios

### Scenario: Calculate route with live traffic
- **Given** the user has multiple destinations
- **When** they request optimization
- **Then** the system fetches a route using real-time traffic data
- **And** the total duration reflects current traffic conditions.

### Scenario: Display fuel consumption
- **Given** a calculated route
- **When** the route details are displayed
- **Then** the estimated fuel consumption (e.g., in Liters) is shown based on the total distance.

### Scenario: Manual override of optimized route
- **Given** an optimized route is currently displayed
- **When** the user manually drags a destination to a new position
- **Then** the system recalculates the route following the EXACT order specified by the user without re-optimizing the sequence
- **And** traffic and fuel metrics are updated for the new route.
