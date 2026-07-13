# Capability: Destination Management

## Context
Users need to add multiple stops (destinations) to plan their route.

## Scenarios

### Scenario: Add a destination via search
- **Given** the user is on the main app
- **When** they search for a location and select it from the results
- **Then** the destination is added to the list
- **And** the list displays the updated total count (up to a maximum, e.g., MAX_DESTINATIONS).

### Scenario: Reorder destinations
- **Given** the user has multiple destinations in the list
- **When** they drag and drop a destination to a new position
- **Then** the list order is updated accordingly.

### Scenario: Remove a destination
- **Given** a destination in the list
- **When** the user clicks the remove button
- **Then** it is removed from the list
- **And** any active calculated route is cleared.
