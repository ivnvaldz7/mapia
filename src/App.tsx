import { useState, useCallback, useEffect, useRef, useReducer } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import DestinationList from './components/DestinationList'
import RoutePanel from './components/RoutePanel'
import { optimizeRoute, getDirections, reverseGeocode } from './lib/ors'
import { estimateFuelConsumption } from './lib/fuel'
import { MAX_DESTINATIONS, ORS_API_KEY } from './lib/constants'
import { reducer, initialState } from './lib/reducer'
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
  const [state, dispatch] = useReducer(reducer, initialState)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(() => !ORS_API_KEY)
  const [focusCoord, setFocusCoord] = useState<{ lat: number; lng: number } | null>(null)
  const directionsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!state.maxWarn) return
    const t = setTimeout(() => dispatch({ type: 'SET_MAX_WARN', payload: false }), 3000)
    return () => clearTimeout(t)
  }, [state.maxWarn])

  const addDestination = useCallback((result: GeocodingResult) => {
    if (state.destinations.length >= MAX_DESTINATIONS) {
      dispatch({ type: 'SET_MAX_WARN', payload: true })
      return
    }
    if (result.lat == null || result.lng == null) {
      dispatch({ type: 'SET_ERROR', payload: `"${result.label}" no tiene coordenadas disponibles. Probá con un lugar más específico.` })
      return
    }
    dispatch({
      type: 'ADD_DESTINATION',
      payload: {
        id: String(nextId++),
        name: result.label,
        lat: result.lat,
        lng: result.lng,
      },
    })
  }, [state.destinations.length])

  const handleOptimize = useCallback(async (dests?: Destination[]) => {
    const targets = dests ?? state.destinations
    if (targets.length < 2) return
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ROUTE', payload: null })

    try {
      const { orderedDestinations, directions } = await optimizeRoute(targets)
      dispatch({ type: 'SET_ROUTE', payload: createRouteResult(orderedDestinations, directions) })
      dispatch({ type: 'SET_DESTINATIONS', payload: orderedDestinations })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Route optimization failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      dispatch({ type: 'SET_ERROR', payload: `Error al optimizar la ruta: ${msg}` })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.destinations])

  const removeDestination = useCallback((id: string) => {
    const remaining = state.destinations.filter((d) => d.id !== id)
    dispatch({ type: 'SET_DESTINATIONS', payload: remaining })

    if (!state.route || remaining.length < 2) {
      dispatch({ type: 'SET_ROUTE', payload: null })
      return
    }

    handleOptimize(remaining)
  }, [state.destinations, state.route, handleOptimize])

  const handleReorderDirections = useCallback(async (dests: Destination[]) => {
    directionsAbortRef.current?.abort()
    const controller = new AbortController()
    directionsAbortRef.current = controller

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const dir = await getDirections(dests, controller.signal)
      dispatch({ type: 'SET_ROUTE', payload: createRouteResult(dests, dir) })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Error al calcular la ruta'
      dispatch({ type: 'SET_ERROR', payload: msg })
      dispatch({ type: 'SET_ROUTE', payload: null })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const reorderDestinations = useCallback((from: number, to: number) => {
    const reordered = [...state.destinations]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    dispatch({ type: 'SET_DESTINATIONS', payload: reordered })

    if (state.route) {
      handleReorderDirections(reordered)
    }
  }, [state.destinations, state.route, handleReorderDirections])

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
              Destinos ({state.destinations.length}/{MAX_DESTINATIONS})
            </h2>
          </div>
          <DestinationList
            destinations={state.destinations}
            onRemove={removeDestination}
            onReorder={reorderDestinations}
            onFocus={(d) => setFocusCoord({ lat: d.lat, lng: d.lng })}
            maxWarn={state.maxWarn}
          />
        </div>

        {/* Route panel */}
        <div className="border-t border-stone-700 p-4">
          {state.errorMsg && (
            <div className="mb-2 flex items-start gap-2 rounded bg-red-900/50 px-3 py-2 text-xs text-red-300">
              <span className="flex-1">{state.errorMsg}</span>
              <button
                onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
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
            destinations={state.destinations}
            route={state.route}
            loading={state.loading}
            onOptimize={!state.route ? handleOptimize : undefined}
          />
        </div>
      </aside>

      <main className="flex-1">
        <MapView
          destinations={state.route?.orderedDestinations ?? state.destinations}
          routeGeometry={state.route?.geometry ?? null}
          focusCoord={focusCoord}
          onMapClick={async (lat, lng) => {
            try {
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
