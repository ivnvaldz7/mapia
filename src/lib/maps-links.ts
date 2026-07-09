import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/** Google Maps directions URL — opens in navigation mode with waypoints */
export function googleMapsLink({ origin, destinations }: MapLinkOptions): string {
  const last = destinations[destinations.length - 1]
  const waypoints = destinations.slice(1, -1).map((d) => latlng(d)).join('|')

  // Manual query string — URLSearchParams encodes commas as %2C which
  // breaks coordinate parsing in Google Maps
  const qs = `api=1&origin=${latlng(origin)}&destination=${latlng(last)}&travelmode=driving`
  return `https://www.google.com/maps/dir/?${qs}${waypoints ? `&waypoints=${waypoints}` : ''}`
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
