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

function buildShareUrl(destinations: Destination[]): string {
  const encoded = destinations
    .map((d) => `${d.lat},${d.lng},${encodeURIComponent(d.name)}`)
    .join('|')
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('d', encoded)
  return url.toString()
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [showMissingKeyBanner, setShowMissingKeyBanner] = useState(() => !ORS_API_KEY)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState(0)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const directionsAbortRef = useRef<AbortController | null>(null)
  const optimizeAbortRef = useRef<AbortController | null>(null)
  const routeRequestIdRef = useRef(0)
  const mapClickQueue = useRef<Promise<void>>(Promise.resolve())

  const cancelRouteRequests = useCallback(() => {
    routeRequestIdRef.current += 1
    directionsAbortRef.current?.abort()
    optimizeAbortRef.current?.abort()
  }, [])

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
    cancelRouteRequests()
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
    if (state.route) dispatch({ type: 'SET_ROUTE', payload: null })
    if (focus) setFocusedId(newId)
  }, [cancelRouteRequests, state.destinations.length, state.route])

  const handleOptimize = useCallback(async (dests?: Destination[]) => {
    const targets = dests ?? state.destinations
    if (targets.length < 2) return

    cancelRouteRequests()
    const requestId = routeRequestIdRef.current
    const controller = new AbortController()
    optimizeAbortRef.current = controller

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ROUTE', payload: null })

    try {
      const pinned = targets.filter(d => d.isPinned)
      const unpinned = targets.filter(d => !d.isPinned)

      let finalOrderedDestinations: Destination[] = []
      let finalDirections: DirectionsResult | null = null

      if (unpinned.length === 0) {
        finalOrderedDestinations = pinned
        finalDirections = await getDirections(pinned, controller.signal)
      } else if (pinned.length === 0) {
        const { orderedDestinations, directions } = await optimizeRoute(unpinned, controller.signal)
        finalOrderedDestinations = orderedDestinations
        finalDirections = directions
      } else {
        const toOptimize = [pinned[pinned.length - 1], ...unpinned]
        const { orderedDestinations } = await optimizeRoute(toOptimize, controller.signal)
        finalOrderedDestinations = [
          ...pinned.slice(0, -1),
          ...orderedDestinations
        ]
        finalDirections = await getDirections(finalOrderedDestinations, controller.signal)
      }

      if (requestId !== routeRequestIdRef.current) return
      dispatch({ type: 'SET_DESTINATIONS', payload: finalOrderedDestinations })
      dispatch({ type: 'SET_ROUTE', payload: createRouteResult(finalOrderedDestinations, finalDirections) })
    } catch (err) {
      if ((err as Error).name === 'AbortError' || requestId !== routeRequestIdRef.current) return
      console.error('Route optimization failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      dispatch({ type: 'SET_ERROR', payload: `Error al optimizar la ruta: ${msg}` })
    } finally {
      if (!controller.signal.aborted && requestId === routeRequestIdRef.current) {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }, [cancelRouteRequests, state.destinations])

  const removeDestination = useCallback((id: string) => {
    const remaining = state.destinations.filter((d) => d.id !== id)
    dispatch({ type: 'SET_DESTINATIONS', payload: remaining })
    if (focusedId === id) setFocusedId(null)

    if (!state.route || remaining.length < 2) {
      cancelRouteRequests()
      dispatch({ type: 'SET_ROUTE', payload: null })
      return
    }

    handleOptimize(remaining)
  }, [cancelRouteRequests, state.destinations, state.route, handleOptimize, focusedId])

  const handleReorderDirections = useCallback(async (dests: Destination[]) => {
    cancelRouteRequests()
    const requestId = routeRequestIdRef.current
    const controller = new AbortController()
    directionsAbortRef.current = controller

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const dir = await getDirections(dests, controller.signal)
      if (requestId !== routeRequestIdRef.current) return
      dispatch({ type: 'SET_ROUTE', payload: createRouteResult(dests, dir) })
    } catch (err) {
      if ((err as Error).name === 'AbortError' || requestId !== routeRequestIdRef.current) return
      const msg = err instanceof Error ? err.message : 'Error al calcular la ruta'
      dispatch({ type: 'SET_ERROR', payload: msg })
      dispatch({ type: 'SET_ROUTE', payload: null })
    } finally {
      if (!controller.signal.aborted && requestId === routeRequestIdRef.current) {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }, [cancelRouteRequests])

  const reorderDestinations = useCallback((from: number, to: number) => {
    const reordered = [...state.destinations]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    dispatch({ type: 'SET_DESTINATIONS', payload: reordered })

    if (state.route) {
      handleReorderDirections(reordered)
    } else {
      cancelRouteRequests()
    }
  }, [cancelRouteRequests, state.destinations, state.route, handleReorderDirections])

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
    const url = buildShareUrl(state.route.orderedDestinations)

    if (navigator.share) {
      navigator.share({
        title: 'mapia — ruta optimizada',
        url,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
        .then(() => {
          setShareFeedback('Enlace copiado al portapapeles')
          setTimeout(() => setShareFeedback(null), 3000)
        })
        .catch(() => {
          setShareFeedback('No se pudo copiar el enlace')
          setTimeout(() => setShareFeedback(null), 3000)
        })
    }
  }, [state.route])

  return (
    <div className="relative flex h-svh w-svw overflow-hidden bg-[#0f1010] text-white md:flex-row">
      {/* Sidebar */}
      <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78svh] w-full flex-col overscroll-contain overflow-y-auto rounded-t-3xl border border-white/10 bg-[#151615]/[0.97] pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black/40 backdrop-blur-xl md:relative md:inset-auto md:z-auto md:h-full md:max-h-none md:overflow-hidden md:rounded-none md:border-y-0 md:border-l-0 md:border-r md:bg-[#151615] md:pb-0 md:shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" aria-hidden="true" />
        {/* Header */}
        <header className="border-b border-white/10 bg-[#191a19] md:static">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-black text-white shadow-lg shadow-indigo-950/40">
                m.
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-stone-100">mapia</h1>
                <p className="text-[11px] text-stone-500">Planificá mejor. Llegá más lejos.</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Beta
            </span>
          </div>
          {showMissingKeyBanner && (
            <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-200">
              <span className="flex-1">
                API Key no detectada. Configurá <code className="break-all rounded bg-amber-800/50 px-1">VITE_ORS_API_KEY</code> en tu entorno.
              </span>
              <button
                onClick={() => setShowMissingKeyBanner(false)}
                className="shrink-0 rounded p-0.5 text-amber-300 transition-colors hover:text-amber-100"
                title="Descartar"
                aria-label="Descartar aviso de API key"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </header>

        {/* Search */}
        <div className="relative z-30 border-b border-white/10 px-4 py-4">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Nuevo destino</p>
          <SearchBar onSelect={addDestination} />
        </div>

        {/* Destination list */}
        <div className="flex-none overflow-visible px-4 py-5 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <div className="mb-3 flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Tu recorrido</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-100">Destinos</h2>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-stone-400">
              {state.destinations.length} / {MAX_DESTINATIONS}
            </span>
          </div>
          <p className="mb-4 px-1 text-xs leading-relaxed text-stone-500">
            Hacé clic en una dirección para ubicarla en el mapa. Arrastrá para cambiar el orden.
          </p>
          <div>
            <DestinationList
              destinations={state.destinations}
              onRemove={removeDestination}
              onReorder={reorderDestinations}
              onFocus={(d) => {
                setFocusedId(d.id)
                setFocusRequest((request) => request + 1)
              }}
              onTogglePin={(id) => {
                cancelRouteRequests()
                dispatch({ type: 'TOGGLE_PIN', payload: id })
                if (state.route) dispatch({ type: 'SET_ROUTE', payload: null })
              }}
              focusedId={focusedId}
              maxWarn={state.maxWarn}
            />
          </div>
        </div>

        {/* Route panel */}
        <div className="border-t border-white/10 bg-[#191a19] px-4 py-4 md:max-h-[48%] md:min-h-0 md:overflow-y-auto">
          {state.errorMsg && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs text-red-200">
              <span className="flex-1">{state.errorMsg}</span>
              <button
                onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
                className="shrink-0 rounded p-0.5 text-red-400 transition-colors hover:text-red-200"
                title="Descartar"
                aria-label="Descartar mensaje de error"
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
              onReset={() => {
                cancelRouteRequests()
                dispatch({ type: 'RESET' })
              }}
              onShare={shareAppUrl}
              shareFeedback={shareFeedback}
            />
          )}
        </div>
      </aside>

      <main className="absolute inset-0 min-h-0 min-w-0 md:relative md:flex-1">
        <MapView
          destinations={state.route?.orderedDestinations ?? state.destinations}
          routeGeometry={state.route?.geometry ?? null}
          focusedId={focusedId}
          focusRequest={focusRequest}
          onMarkerClick={setFocusedId}
          onMapClick={(lat, lng) => {
            mapClickQueue.current = mapClickQueue.current.then(async () => {
              try {
                const label = await reverseGeocode(lat, lng);
                addDestination({ label, lat, lng }, false);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                dispatch({ type: 'SET_ERROR', payload: `No se pudo encontrar dirección: ${msg}` });
              }
            })
          }}
        />
      </main>
    </div>
  )
}
