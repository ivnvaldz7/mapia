import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/**
 * Google Maps directions URL.
 *
 * - useGpsOrigin=true (default): omits the origin so Google Maps uses the
 *   device's GPS location. All destinations are sent as waypoints + destination.
 *   Best for the full-route button — navigation goes GPS → stop 1 → … → final.
 *
 * - useGpsOrigin=false: sets destinations[0] as explicit origin with
 *   dir_action=navigate for immediate turn-by-turn. Best for point-to-point
 *   leg navigation (e.g. "from stop A to stop B").
 */
export function googleMapsLink({ destinations, useGpsOrigin = true }: MapLinkOptions): string {
  if (destinations.length < 1) return 'https://www.google.com/maps'

  // Single destination — always navigate directly
  if (destinations.length === 1) {
    const params = new URLSearchParams()
    params.set('api', '1')
    params.set('destination', latlng(destinations[0]))
    params.set('travelmode', 'driving')
    params.set('dir_action', 'navigate')
    return `https://www.google.com/maps/dir/?${params.toString()}`
  }

  const params = new URLSearchParams()
  params.set('api', '1')
  params.set('travelmode', 'driving')

  if (useGpsOrigin) {
    // GPS origin — all dests as waypoints + final destination
    const lastStop = destinations[destinations.length - 1]
    const waypoints = destinations.slice(0, -1)
    params.set('destination', latlng(lastStop))
    if (waypoints.length > 0) {
      params.set('waypoints', waypoints.map(latlng).join('|'))
    }
  } else {
    // Explicit origin + dir_action=navigate for point-to-point navigation
    const origin = destinations[0]
    const destination = destinations[destinations.length - 1]
    params.set('origin', latlng(origin))
    params.set('destination', latlng(destination))
    params.set('dir_action', 'navigate')
    if (destinations.length > 2) {
      const waypoints = destinations.slice(1, -1)
      params.set('waypoints', waypoints.map(latlng).join('|'))
    }
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/**
 * Waze deep link — navigates to the LAST destination in the provided array.
 * Waze doesn't support multi-stop via URL, so the main button will navigate
 * to the final stop, but this allows us to use it for individual leg buttons.
 */
export function wazeLink({ destinations }: MapLinkOptions): string {
  if (destinations.length === 0) return 'https://www.waze.com/ul'
  const target = destinations[destinations.length - 1]

  const params = new URLSearchParams()
  params.set('ll', latlng(target))
  params.set('navigate', 'yes')
  params.set('z', '10')

  return `https://www.waze.com/ul?${params.toString()}`
}
