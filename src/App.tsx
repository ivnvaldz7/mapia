import { useState, useCallback, useEffect, useRef, useReducer } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import DestinationList from './components/DestinationList'
import RoutePanel from './components/RoutePanel'
import { optimizeRoute, getDirections, reverseGeocode } from './lib/ors'
import { googleMapsLink } from './lib/maps-links'
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
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const directionsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!state.maxWarn) return
    const t = setTimeout(() => dispatch({ type: 'SET_MAX_WARN', payload: false }), 3000)
    return () => clearTimeout(t)
  }, [state.maxWarn])

  const addDestination = useCallback((result: GeocodingResult, focus = true) => {
    if (state.destinations.length >= MAX_DESTINATIONS) {
      dispatch({ type: 'SET_MAX_WARN', payload: true })
      return
    }
    if (result.lat == null || result.lng == null) {
      dispatch({ type: 'SET_ERROR', payload: `"${result.label}" no tiene coordenadas disponibles. Probá con un lugar más específico.` })
      return
    }
    const newId = String(nextId++)
    dispatch({
      type: 'ADD_DESTINATION',
      payload: {
        id: newId,
        name: result.label,
        lat: result.lat,
        lng: result.lng,
      },
    })
    if (focus) setFocusedId(newId)
  }, [state.destinations.length])

  const handleOptimize = useCallback(async (dests?: Destination[]) => {
    const targets = dests ?? state.destinations
    if (targets.length < 2) return
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ROUTE', payload: null })

    try {
      const pinned = targets.filter(d => d.isPinned)
      const unpinned = targets.filter(d => !d.isPinned)

      let finalOrderedDestinations: Destination[] = []
      let finalDirections: DirectionsResult | null = null

      if (unpinned.length === 0) {
        finalOrderedDestinations = pinned
        finalDirections = await getDirections(pinned)
      } else if (pinned.length === 0) {
        const { orderedDestinations, directions } = await optimizeRoute(unpinned)
        finalOrderedDestinations = orderedDestinations
        finalDirections = directions
      } else {
        const toOptimize = [pinned[pinned.length - 1], ...unpinned]
        const { orderedDestinations } = await optimizeRoute(toOptimize)
        finalOrderedDestinations = [
          ...pinned.slice(0, -1),
          ...orderedDestinations
        ]
        finalDirections = await getDirections(finalOrderedDestinations)
      }

      dispatch({ type: 'SET_DESTINATIONS', payload: finalOrderedDestinations })
      dispatch({ type: 'SET_ROUTE', payload: createRouteResult(finalOrderedDestinations, finalDirections) })
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
    if (focusedId === id) setFocusedId(null)

    if (!state.route || remaining.length < 2) {
      dispatch({ type: 'SET_ROUTE', payload: null })
      return
    }

    handleOptimize(remaining)
  }, [state.destinations, state.route, handleOptimize, focusedId])

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

  // Parse shared URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('d')
    if (shared) {
      try {
        const dests = shared.split('|').map(s => {
          const [lat, lng, ...nameParts] = s.split(',')
          return {
            id: String(nextId++),
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            name: decodeURIComponent(nameParts.join(',')),
          }
        }).filter(d => !isNaN(d.lat) && !isNaN(d.lng))
        
        if (dests.length > 0) {
          dispatch({ type: 'SET_DESTINATIONS', payload: dests })
          if (dests.length >= 2) {
            handleOptimize(dests)
          }
        }
        window.history.replaceState({}, '', window.location.pathname)
      } catch (e) {
        console.error('Failed to parse shared route', e)
      }
    }
  }, [handleOptimize])

  const shareAppUrl = useCallback(() => {
    if (!state.route || state.route.orderedDestinations.length === 0) return
    const url = googleMapsLink({ destinations: state.route.orderedDestinations })
    
    if (navigator.share) {
      navigator.share({
        title: 'Ruta en Google Maps',
        url,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      alert('Enlace de Google Maps copiado al portapapeles')
    }
  }, [state.route])

  return (
    <div className="flex h-svh w-svw flex-col bg-stone-900 text-white md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col overflow-y-auto border-stone-700 bg-stone-900 md:w-96 md:border-r">
        {/* Header */}
        <header className="border-b border-stone-700">
          <div className="p-4 flex items-center justify-between">
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
            onFocus={(d) => setFocusedId(d.id)}
            onTogglePin={(id) => dispatch({ type: 'TOGGLE_PIN', payload: id })}
            focusedId={focusedId}
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
          {!state.route && (
            <RoutePanel
              destinations={state.destinations}
              loading={state.loading}
              onOptimize={() => handleOptimize()}
            />
          )}
          {state.route && (
            <RoutePanel
              route={state.route}
              onReset={() => dispatch({ type: 'RESET' })}
              onShare={shareAppUrl}
            />
          )}
        </div>
      </aside>

      <main className="flex-1">
        <MapView
          destinations={state.route?.orderedDestinations ?? state.destinations}
          routeGeometry={state.route?.geometry ?? null}
          focusedId={focusedId}
          onMarkerClick={setFocusedId}
          onMapClick={async (lat, lng) => {
            try {
              const label = await reverseGeocode(lat, lng);
              addDestination({ label, lat, lng }, false);
            } catch (err) {
              dispatch({ type: 'SET_ERROR', payload: `No se pudo encontrar dirección: ${err}` });
            }
          }}
        />
      </main>
    </div>
  )
}
