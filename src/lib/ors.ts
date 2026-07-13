import { ORS_BASE_URL, ORS_API_KEY } from './constants'
import type { Destination, DirectionsResult } from './types'

export interface GeocodingResult {
  label: string
  lat: number
  lng: number
}

/** Photon geocoding — free, no API key, supports street numbers in Argentina */
const PHOTON_URL = 'https://photon.komoot.io/api/'
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse'

/** Buenos Aires center — used as geographic bias for search results */
const BIAS_LAT = -34.6037
const BIAS_LNG = -58.3816

async function orsFetch(endpoint: string, body: unknown, signal?: AbortSignal) {
  const res = await fetch(`${ORS_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ORS_API_KEY ? { Authorization: ORS_API_KEY } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ORS ${endpoint} ${res.status}: ${text}`)
  }

  return res.json()
}

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '5',
    lat: String(BIAS_LAT),
    lon: String(BIAS_LNG),
  })

  const res = await fetch(`${PHOTON_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal,
  })

  if (!res.ok) {
    throw new Error('Error al buscar direcciones')
  }

  const data = await res.json()

  return (data.features ?? [])
    .map((f: { geometry: { coordinates: [number, number] }; properties: { name?: string; street?: string; housenumber?: string; city?: string; state?: string; country?: string } }) => {
      const [lng, lat] = f.geometry?.coordinates ?? [null, null]
      if (lat == null || lng == null) return null

      const p = f.properties

      // Build primary part: prefer street+housenumber, fall back to name
      let primary = ''
      if (p.street) {
        primary = p.housenumber ? `${p.street} ${p.housenumber}` : p.street
      } else if (p.name) {
        primary = p.name
      }
      if (!primary) return null

      // Build context: city, state
      const context = [p.city, p.state].filter(Boolean)
      const label = context.length > 0 ? `${primary}, ${context.join(', ')}` : primary

      return { label, lat, lng }
    })
    .filter((r: GeocodingResult | null): r is GeocodingResult => r !== null)
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    limit: '1',
  })

  const res = await fetch(`${PHOTON_REVERSE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) return fallback

  const data = await res.json()
  const f = data.features?.[0]
  if (!f) return fallback

  const p = f.properties
  let primary = ''
  if (p.street) {
    primary = p.housenumber ? `${p.street} ${p.housenumber}` : p.street
  } else if (p.name) {
    primary = p.name
  }
  if (!primary) return fallback

  const context = [p.city, p.state].filter(Boolean)
  return context.length > 0 ? `${primary}, ${context.join(', ')}` : primary
}

export async function getDirections(
  destinations: Destination[],
  signal?: AbortSignal,
): Promise<DirectionsResult> {
  const coordinates = destinations.map((d) => [d.lng, d.lat])

  const data = await orsFetch('/v2/directions/driving-car', {
    coordinates,
    geometry_simplify: true,
    instructions: false,
  }, signal)

  if (!data.routes?.length) {
    throw new Error('No se encontró una ruta entre los destinos seleccionados')
  }

  const route = data.routes[0]
  const segments: { distance: number; duration: number }[] = (route.segments ?? []).map(
    (seg: { distance: number; duration: number }) => ({
      distance: seg.distance,
      duration: seg.duration,
    }),
  )

  return {
    distance: route.summary?.distance ?? 0,
    duration: route.summary?.duration ?? 0,
    geometry: route.geometry as GeoJSON.LineString,
    segments,
  }
}

export async function optimizeRoute(destinations: Destination[]): Promise<{ orderedDestinations: Destination[], directions: DirectionsResult }> {
  if (!Array.isArray(destinations)) {
    throw new Error('optimizeRoute: destinos inválidos')
  }
  if (destinations.length <= 2) {
    const directions = await getDirections(destinations);
    return { orderedDestinations: destinations, directions };
  }

  const jobs = destinations.slice(1).map((d, i) => ({
    id: i + 1,
    location: [d.lng, d.lat]
  }));

  const vehicles = [{
    id: 1,
    profile: 'driving-car',
    start: [destinations[0].lng, destinations[0].lat]
  }];

  const data = await orsFetch('/optimization', { jobs, vehicles });
  
  if (data.code !== 0) {
    throw new Error(data.error || 'Error en la optimización de ruta')
  }

  const optimizedDestinations: Destination[] = [destinations[0]];
  const steps = data.routes[0].steps;
  
  for (const step of steps) {
    if (step.type === 'job') {
      optimizedDestinations.push(destinations[step.job]);
    }
  }

  const directions = await getDirections(optimizedDestinations);

  return { orderedDestinations: optimizedDestinations, directions };
}
