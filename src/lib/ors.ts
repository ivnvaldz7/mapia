import { ORS_BASE_URL, ORS_API_KEY, GEOCODING_COUNTRY } from './constants'
import type { Destination, DirectionsResult } from './types'

export interface GeocodingResult {
  label: string
  lat: number
  lng: number
}

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
    text: query,
    size: '5',
    'boundary.country': GEOCODING_COUNTRY,
  })
  if (ORS_API_KEY) params.append('api_key', ORS_API_KEY)

  const res = await fetch(`${ORS_BASE_URL}/geocode/autocomplete?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error('Geocoding autocomplete failed')
  }

  const data = await res.json()

  return (data.features ?? [])
    .map((f: Record<string, unknown>) => {
      const coords = (f.geometry as { coordinates?: [number, number] })?.coordinates
      const [lng, lat] = coords ?? [null, null] as unknown as [number, number]
      return {
        label: (f.properties as { label?: string })?.label ?? '',
        lat,
        lng,
      }
    })
    .filter((r: { label: string; lat: unknown; lng: unknown }) => r.label && typeof r.lat === 'number' && typeof r.lng === 'number')
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    'point.lat': lat.toString(),
    'point.lon': lng.toString(),
    size: '1',
  })
  if (ORS_API_KEY) params.append('api_key', ORS_API_KEY)

  const res = await fetch(`${ORS_BASE_URL}/geocode/reverse?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  })

  if (!res.ok) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const data = await res.json()
  if (data.features && data.features.length > 0) {
    return data.features[0].properties.label || data.features[0].properties.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
  
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
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
