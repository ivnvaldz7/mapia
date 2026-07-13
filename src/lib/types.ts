export interface Destination {
  id: string
  name: string
  lat: number
  lng: number
  isPinned?: boolean
}

export interface RouteResult {
  orderedDestinations: Destination[]
  totalDistance: number
  totalDuration: number
  fuelConsumption: number
  geometry: GeoJSON.LineString
  legs: RouteLeg[]
}

export interface RouteLeg {
  from: string
  to: string
  distance: number
  duration: number
}

export interface DirectionsResult {
  distance: number
  duration: number
  geometry: GeoJSON.LineString
  segments: { distance: number; duration: number }[]
}

export interface MapLinkOptions {
  destinations: Destination[]
  /** When true (default), omits origin so Google Maps uses GPS location.
   *  When false, uses destinations[0] as explicit origin + dir_action=navigate. */
  useGpsOrigin?: boolean
}
