import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/** Google Maps directions URL — native /dir/ format with waypoints */
export function googleMapsLink({ destinations }: MapLinkOptions): string {
  // destinations includes origin as first element
  const coords = destinations.map((d) => latlng(d))

  // Calculate map center from all stops
  const centerLat = destinations.reduce((s, d) => s + d.lat, 0) / destinations.length
  const centerLng = destinations.reduce((s, d) => s + d.lng, 0) / destinations.length

  // /dir/{origin}/{waypoint}/{destination}/@{center},15z
  return `https://www.google.com/maps/dir/${coords.join('/')}/@${centerLat},${centerLng},14z/`
}

/** Waze deep link — navigates to origin (multi-stop not available via URL) */
export function wazeLink({ origin }: MapLinkOptions): string {
  const base = 'https://www.waze.com/ul'
  const params = new URLSearchParams()
  params.set('ll', latlng(origin))
  params.set('navigate', 'yes')
  params.set('q', origin.name)

  return `${base}?${params.toString()}`
}
