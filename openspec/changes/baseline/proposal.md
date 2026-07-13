# Proposal: Establish Baseline Specs

## Intent
To generate the Product Requirements Document (PRD), current-state, and context for Mapia so that future feature development can utilize the Spec-Driven Development (SDD) workflow.

## Scope
### In Scope
- Document existing destination management.
- Document map interactions.
- Document route optimization.

### Out of Scope
- Adding new features.
- Fixing existing bugs.

## Capabilities
### New Capabilities
- `destination-management`: Adding, removing, and reordering destinations.
- `map-visualization`: Displaying destinations and routes on a MapLibre map.
- `route-optimization`: Calculating optimal routes via TSP and ORS.

### Modified Capabilities
- None

## Approach
Extract existing logic from `App.tsx` and `lib/` to create `openspec/specs/` files representing the baseline.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `openspec/specs/` | New | Baseline specs creation |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing implicit logic | Low | Code inspection |

## Rollback Plan
Delete the `openspec` directory.

## Dependencies
- None

## Success Criteria
- [ ] SDD context is initialized.
- [ ] Baseline specs are created and reflect the current app state.
