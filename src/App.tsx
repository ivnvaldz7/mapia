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
  const [maxWarn, setMaxWarn] = useState(false)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(() => !ORS_API_KEY)
  const directionsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!maxWarn) return
    const t = setTimeout(() => setMaxWarn(false), 3000)
    return () => clearTimeout(t)
  }, [maxWarn])

  const addDestination = useCallback((result: GeocodingResult) => {
    if (destinations.length >= MAX_DESTINATIONS) {
      setMaxWarn(true)
      return
    }
    setDestinations((prev) => [
      ...prev,
      {
        id: String(nextId++),
        name: result.label,
        lat: result.lat,
        lng: result.lng,
      },
    ])
    setRoute(null)
  }, [destinations])

  const handleOptimize = useCallback(async (dests?: Destination[]) => {
    const targets = dests ?? destinations
    if (targets.length < 2) return
    setLoading(true)
    setRoute(null)

    try {
      const { orderedDestinations, directions } = await optimizeRoute(targets)
      setRoute(createRouteResult(orderedDestinations, directions))
      
      // Update the destinations list to match the optimized order
      setDestinations(orderedDestinations)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Route optimization failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`Error al optimizar la ruta: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [destinations])

  const removeDestination = useCallback((id: string) => {
    const remaining = destinations.filter((d) => d.id !== id)
    setDestinations(remaining)

    if (!route || remaining.length < 2) {
      setRoute(null)
      return
    }

    handleOptimize(remaining)
  }, [destinations, route, handleOptimize])

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

  return (
    <div className="flex h-svh w-svw flex-col bg-stone-900 text-white md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col overflow-y-auto border-stone-700 bg-stone-900 md:w-96 md:border-r">
        {/* Header */}
        <header className="border-b border-stone-700">
          <div className="p-4">
            <h1 className="text-lg font-bold tracking-tight">
              mapia{' '}
              <span className="text-xs font-normal text-stone-500">
                — optimizador de rutas
              </span>
            </h1>
          </div>
          {showMissingKeyBanner && (
            <div className="flex items-start gap-2 border-t border-amber-700 bg-amber-900/60 px-4 py-2 text-xs text-amber-200">
              <span className="flex-1">
                API Key no detectada. Configurá <code className="rounded bg-amber-800/50 px-1">VITE_ORS_API_KEY</code> en tu entorno.
              </span>
              <button
                onClick={() => setShowMissingKeyBanner(false)}
                className="shrink-0 rounded p-0.5 text-amber-300 transition-colors hover:text-amber-100"
                title="Descartar"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
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
            maxWarn={maxWarn}
          />
        </div>

        {/* Route panel */}
        <div className="border-t border-stone-700 p-4">
          {errorMsg && (
            <div className="mb-2 flex items-start gap-2 rounded bg-red-900/50 px-3 py-2 text-xs text-red-300">
              <span className="flex-1">{errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:text-red-200"
                title="Descartar"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <RoutePanel
            destinations={destinations}
            route={route}
            loading={loading}
            onOptimize={!route ? handleOptimize : undefined}
          />
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
