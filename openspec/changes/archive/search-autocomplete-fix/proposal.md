# Proposal: Search Autocomplete Fix

## Intent
Make the location search bar provide live autocomplete suggestions as the user types, mimicking Google Maps behavior, by fixing the broken geocoding API call.

## Scope
### In Scope
- Change `geocode` in `ors.ts` to use `GET /geocode/autocomplete`.
- Pass parameters via query string instead of JSON body.

### Out of Scope
- Changing the search bar UI (it already supports a dropdown).

## Capabilities
### New Capabilities
- None

### Modified Capabilities
- `destination-management`: The search functionality is fixed to provide live suggestions.

## Approach
Rewrite the `geocode` function to bypass `orsFetch` (which enforces POST) and perform a native `fetch` with `GET` and `URLSearchParams`.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/ors.ts` | Modified | `geocode` function rewritten |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rate limiting | Medium | `SearchBar.tsx` already implements a 400ms debounce. |

## Rollback Plan
Revert changes to `src/lib/ors.ts`.

## Dependencies
- ORS Geocoding API
