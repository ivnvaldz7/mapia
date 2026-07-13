import type { Destination, MapLinkOptions } from './types'

function latlng(d: Destination) {
  return `${d.lat},${d.lng}`
}

/**
 * Google Maps directions URL — explicit origin with dir_action=navigate.
 * If the user is physically at the origin, it triggers the "Iniciar" button.
 * If not, it shows a preview from that origin.
 */
export function googleMapsLink({ destinations }: MapLinkOptions): string {
  if (destinations.length < 1) return 'https://www.google.com/maps'
  if (destinations.length === 1) {
    const params = new URLSearchParams()
    params.set('api', '1')
    params.set('destination', latlng(destinations[0]))
    params.set('travelmode', 'driving')
    params.set('dir_action', 'navigate')
    return `https://www.google.com/maps/dir/?${params.toString()}`
  }

  const origin = destinations[0]
  const lastStop = destinations[destinations.length - 1]
  const waypoints = destinations.slice(1, -1)

  const params = new URLSearchParams()
  params.set('api', '1')
  params.set('origin', latlng(origin))
  params.set('destination', latlng(lastStop))
  params.set('travelmode', 'driving')
  params.set('dir_action', 'navigate')

  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map(latlng).join('|'))
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
