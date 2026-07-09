export const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY ?? ''

export const ORS_BASE_URL = 'https://api.openrouteservice.org'

/** OpenFreeMap tile style — no API key required */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export const DEFAULT_CENTER: [number, number] = [-58.3816, -34.6037] // Buenos Aires
export const DEFAULT_ZOOM = 12

export const DEBOUNCE_MS = 400

export const MAX_DESTINATIONS = 10

/** Fuel efficiency in liters per 100 km */
export const FUEL_LITERS_PER_100KM = 8
