import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl'
import { MAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants'
import type { Destination } from '../lib/types'

interface MapViewProps {
  destinations: Destination[]
  routeGeometry: GeoJSON.LineString | null
  onMapClick?: (lat: number, lng: number) => void
}

export default function MapView({ destinations, routeGeometry, onMapClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.resize()
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Re-register click handler when onMapClick changes (avoids stale closure)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return

    const handler = (e: maplibregl.MapMouseEvent) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng)
    }

    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [onMapClick])

  // Update markers when destinations change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const valid = destinations.filter((d) => d.lat != null && d.lng != null)
    if (valid.length === 0) return

    // Create markers with numbered labels
    valid.forEach((dest, i) => {
      const el = document.createElement('div')
      el.className =
        'flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg border-2 border-white'
      el.textContent = `${i + 1}`
      el.style.cursor = 'pointer'

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.lng!, dest.lat!])
        .setPopup(new maplibregl.Popup().setText(dest.name))
        .addTo(map)

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    const bounds = new maplibregl.LngLatBounds()
    valid.forEach((d) => bounds.extend([d.lng!, d.lat!]))
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 })
  }, [destinations])

  // Update route polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const sourceId = 'route-line'
    const layerId = 'route-line-layer'

    // Clean up existing
    if (map.getLayer(layerId)) map.removeLayer(layerId)
    if (map.getSource(sourceId)) map.removeSource(sourceId)

    if (!routeGeometry) return

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: routeGeometry,
      },
    })

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#4f46e5',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    })
  }, [routeGeometry])

  return <div ref={containerRef} className="h-full w-full" />
}
