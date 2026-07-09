import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/** Google Maps directions URL — uses modern /dir/ format with waypoints */
export function googleMapsLink({ destinations }: MapLinkOptions): string {
  // destinations includes origin as first element
  const segments = destinations.map((d) => latlng(d))
  return `https://www.google.com/maps/dir/${segments.join('/')}/`
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
