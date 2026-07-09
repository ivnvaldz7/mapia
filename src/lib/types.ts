export interface Destination {
  id: string
  name: string
  lat: number
  lng: number
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
  origin: Destination
  destinations: Destination[] // in optimized order
}
