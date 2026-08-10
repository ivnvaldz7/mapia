import { useEffect, useRef, useState } from 'react'
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl'
import { MAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from '../lib/constants'
import type { Destination } from '../lib/types'

interface MapViewProps {
  destinations: Destination[]
  routeGeometry: GeoJSON.LineString | null
  focusedId: string | null
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (id: string) => void
  focusRequest: number
}

export default function MapView({ destinations, routeGeometry, focusedId, focusRequest, onMapClick, onMarkerClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const lastInteraction = useRef<'map'|'list'>('list')
  const prevFocusedId = useRef<string | null>(null)
  const prevFocusRequest = useRef(0)
  const [mapReady, setMapReady] = useState(false)

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
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Re-register click handler when onMapClick changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return

    const handler = (e: maplibregl.MapMouseEvent) => {
      // Ignore click if it originated from a marker
      const target = e.originalEvent.target as HTMLElement
      if (target.closest('.maplibregl-marker') || target.closest('.maplibregl-marker-custom') || target.dataset.id) {
        return
      }
      onMapClick(e.lngLat.lat, e.lngLat.lng)
    }

    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [onMapClick])

  // Update markers when destinations change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const valid = destinations.filter((d) => d.lat != null && d.lng != null)
    if (valid.length === 0) return

    // Create markers with numbered labels
    valid.forEach((dest, i) => {
      const el = document.createElement('div')
      el.dataset.id = dest.id
      el.className = 'maplibregl-marker-custom'
      el.style.cursor = 'pointer'

      const content = document.createElement('div')
      content.className =
        'flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-lg border-2 border-white transition-all duration-300'
      content.textContent = `${i + 1}`
      el.append(content)
      
      el.onclick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        lastInteraction.current = 'map'
        if (onMarkerClick) onMarkerClick(dest.id)
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.lng!, dest.lat!])
        .addTo(map)

      markersRef.current.push(marker)
    })

    // Camera: fitBounds for 2+ destinations so all pins are visible.
    // For 1 destination the focus effect handles camera movement when needed
    // (SearchBar additions) or skips it (map click additions — user is already there).
    if (valid.length >= 2) {
      const bounds = new maplibregl.LngLatBounds()
      valid.forEach((d) => bounds.extend([d.lng!, d.lat!]))
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 })
    }
  }, [destinations, mapReady, onMarkerClick])

  // Update route polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const apply = () => {
      const sourceId = 'route-line'
      const layerId = 'route-line-layer'

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
    }

    if (map.isStyleLoaded()) {
      apply()
    } else {
      map.once('load', apply)
      return () => { map.off('load', apply) }
    }
  }, [routeGeometry])

  // Fly to focused coordinate and animate marker when a destination is clicked in the list
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const targetDest = destinations.find(d => d.id === focusedId)

    const focusChanged = focusedId !== prevFocusedId.current
    const focusRequested = focusRequest !== prevFocusRequest.current
    prevFocusedId.current = focusedId
    prevFocusRequest.current = focusRequest

    // Only fly for sidebar requests; marker clicks should not move the camera.
    if ((focusChanged || focusRequested) && lastInteraction.current !== 'map' && targetDest && targetDest.lat != null && targetDest.lng != null) {
      map.flyTo({ center: [targetDest.lng, targetDest.lat], zoom: 16, duration: 800 })
    }
    
    // Reset for next time
    lastInteraction.current = 'list'

    // Toggle animation classes on marker elements
    markersRef.current.forEach((marker) => {
      const markerElement = marker.getElement()
      const content = markerElement.firstElementChild
      if (!(content instanceof HTMLElement)) return

      if (markerElement.dataset.id === focusedId) {
        content.classList.remove('bg-indigo-600')
        content.classList.add('motion-safe:animate-bounce', 'bg-amber-500', 'ring-4', 'ring-amber-400/50', 'scale-125', 'z-10')
      } else {
        content.classList.remove('motion-safe:animate-bounce', 'bg-amber-500', 'ring-4', 'ring-amber-400/50', 'scale-125', 'z-10')
        content.classList.add('bg-indigo-600')
      }
    })
  }, [focusedId, focusRequest, destinations, mapReady])

  return <div ref={containerRef} className="h-full w-full" />
}
