import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/** Google Maps directions URL with waypoints — uses clean coordinate format */
export function googleMapsLink({ origin, destinations }: MapLinkOptions): string {
  const base = 'https://www.google.com/maps/dir/?api=1'
  // destinations array includes origin as first element
  const waypoints = destinations
    .slice(1, -1)
    .map((d) => latlng(d))
    .join('|')
  const last = destinations[destinations.length - 1]

  const params = new URLSearchParams()
  params.set('origin', latlng(origin))
  params.set('destination', latlng(last))
  params.set('travelmode', 'driving')
  if (waypoints) params.set('waypoints', waypoints)

  return `${base}&${params.toString()}`
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
