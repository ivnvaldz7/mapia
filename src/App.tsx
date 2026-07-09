import { useState, useCallback, useEffect, useRef } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import DestinationList from './components/DestinationList'
import RoutePanel from './components/RoutePanel'
import { optimizeRoute, getDirections } from './lib/ors'
import { estimateFuelConsumption } from './lib/fuel'
import { MAX_DESTINATIONS, ORS_API_KEY } from './lib/constants'
import type { Destination, RouteResult, DirectionsResult } from './lib/types'
import type { GeocodingResult } from './lib/ors'

function createRouteResult(ordered: Destination[], dir: DirectionsResult): RouteResult {
  const legs = ordered.slice(0, -1).map((from, i) => {
    const to = ordered[i + 1]
    const seg = dir.segments[i] || {
      distance: dir.distance / (ordered.length - 1),
      duration: dir.duration / (ordered.length - 1),
    }
    return {
      from: from.name.split(',')[0].trim(),
      to: to.name.split(',')[0].trim(),
      distance: seg.distance,
      duration: seg.duration,
    }
  })

  return {
    orderedDestinations: ordered,
    totalDistance: dir.distance,
    totalDuration: dir.duration,
    fuelConsumption: estimateFuelConsumption(dir.distance),
    geometry: dir.geometry,
    legs,
  }
}

let nextId = 1

export default function App() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const directionsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!ORS_API_KEY) {
      alert("ATENCIÓN: Tu navegador no detecta la API Key. Por favor corta tu servidor 'npm run dev' en tu terminal, volvelo a ejecutar y apretá F5.")
    }
  }, [])

  const addDestination = useCallback((result: GeocodingResult) => {
    setDestinations((prev) => {
      if (prev.length >= MAX_DESTINATIONS) return prev
      return [
        ...prev,
        {
          id: String(nextId++),
          name: result.label,
          lat: result.lat,
          lng: result.lng,
        },
      ]
    })
    setRoute(null)
  }, [])

  const removeDestination = useCallback((id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    setRoute((prev) => (prev ? null : prev))
  }, [])

  const handleReorderDirections = useCallback(async (dests: Destination[]) => {
    directionsAbortRef.current?.abort()
    const controller = new AbortController()
    directionsAbortRef.current = controller

    setLoading(true)
    try {
      const dir = await getDirections(dests, controller.signal)
      setRoute(createRouteResult(dests, dir))
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Error al calcular la ruta'
      setErrorMsg(msg)
      setRoute(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const reorderDestinations = useCallback((from: number, to: number) => {
    const reordered = [...destinations]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setDestinations(reordered)

    if (route) {
      handleReorderDirections(reordered)
    }
  }, [destinations, route, handleReorderDirections])

  const handleOptimize = useCallback(async () => {
    if (destinations.length < 2) return
    setLoading(true)
    setRoute(null)

    try {
      const { orderedDestinations, directions } = await optimizeRoute(destinations)
      setRoute(createRouteResult(orderedDestinations, directions))
      
      // Update the destinations list to match the optimized order
      setDestinations(orderedDestinations)
    } catch (err) {
      console.error('Route optimization failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`Error al optimizar la ruta: ${msg}`)
      alert(`Fallo en la optimización: ${msg}\n\nSi el error es CORS, puede que la API Key sea inválida o el endpoint esté bloqueado.`)
    } finally {
      setLoading(false)
    }
  }, [destinations])

  return (
    <div className="flex h-svh w-svw flex-col bg-stone-900 text-white md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col overflow-y-auto border-stone-700 bg-stone-900 md:w-96 md:border-r">
        {/* Header */}
        <header className="border-b border-stone-700 p-4">
          <h1 className="text-lg font-bold tracking-tight">
            mapia{' '}
            <span className="text-xs font-normal text-stone-500">
              — optimizador de rutas
            </span>
          </h1>
        </header>

        {/* Search */}
        <div className="border-b border-stone-700 p-4">
          <SearchBar onSelect={addDestination} />
        </div>

        {/* Destination list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Destinos ({destinations.length}/{MAX_DESTINATIONS})
            </h2>
          </div>
          <DestinationList
            destinations={destinations}
            onRemove={removeDestination}
            onReorder={reorderDestinations}
          />
        </div>

        {/* Route panel */}
        <div className="border-t border-stone-700 p-4">
          {errorMsg && (
            <p className="mb-2 rounded bg-red-900/50 px-3 py-2 text-xs text-red-300">
              {errorMsg}
            </p>
          )}
          <div onClick={route ? undefined : handleOptimize}>
            <RoutePanel
              destinations={destinations}
              route={route}
              loading={loading}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <MapView
          destinations={route?.orderedDestinations ?? destinations}
          routeGeometry={route?.geometry ?? null}
          onMapClick={async (lat, lng) => {
            try {
              const { reverseGeocode } = await import('./lib/ors');
              const label = await reverseGeocode(lat, lng);
              addDestination({ label, lat, lng });
            } catch {
              addDestination({ label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
            }
          }}
        />
      </main>
    </div>
  )
}
