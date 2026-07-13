## Exploration: Autocomplete / Suggestions Fix

### Current State
`SearchBar.tsx` has UI for a dropdown of suggestions. However, the `geocode` function in `src/lib/ors.ts` calls `/geocode/search` using a `POST` request with a JSON body via `orsFetch`. The ORS Geocoding API (Pelias) requires a `GET` request with query parameters. Also, `/geocode/search` is less ideal for partial text than `/geocode/autocomplete`.

### Affected Areas
- `src/lib/ors.ts` — `geocode` function needs to use `GET` and the correct endpoint.

### Approaches
1. **Fix ORS API Call:** Change the `geocode` function to use `GET /geocode/autocomplete` with `URLSearchParams`. This will make the existing UI dropdown work properly.

### Recommendation
Implement Approach 1. The UI is already built; we just need to fix the backend call so that suggestions actually load.

### Ready for Proposal
Yes
