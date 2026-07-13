# Tasks: Search Autocomplete Fix

## 1. API Fix
- [x] 1.1 In `src/lib/ors.ts`, rewrite `geocode(query: string)` to use `GET /geocode/autocomplete`.
- [x] 1.2 Construct query parameters using `URLSearchParams` including `text`, `boundary.country=AR`, and optionally `api_key` if `ORS_API_KEY` is present.
- [x] 1.3 Ensure it returns the `GeocodingResult[]` format expected by `SearchBar.tsx`.
