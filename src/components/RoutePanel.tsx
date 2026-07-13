import type { Destination, RouteResult } from '../lib/types'
import { googleMapsLink, wazeLink } from '../lib/maps-links'

interface RoutePanelProps {
  destinations?: Destination[]
  route?: RouteResult | null
  loading?: boolean
  onOptimize?: () => void
  onShare?: () => void
  onReset?: () => void
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m)} m`
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

export default function RoutePanel({ destinations, route, loading, onOptimize, onShare, onReset }: RoutePanelProps) {
  if (!route) {
    const ready = destinations && destinations.length >= 2
    return (
      <div className="space-y-4">
        {!ready && destinations && (
          <div className="rounded-lg border border-dashed border-stone-600 p-4 text-center text-sm text-stone-500">
            Agregá al menos 2 destinos para optimizar la ruta
          </div>
        )}
        <button
          disabled={!ready || loading}
          onClick={() => onOptimize?.()}
          className={`w-full rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all
            ${
              ready && !loading
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]'
                : 'cursor-not-allowed bg-stone-800 text-stone-500'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculando…
            </span>
          ) : (
            'Optimizar Ruta'
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Route info */}
      <div className="flex flex-col gap-4">
        {/* Metrics container */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-stone-800 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Distancia Total
            </p>
            <p className="mt-1 text-lg font-bold text-indigo-400">
              {formatDistance(route.totalDistance)}
            </p>
          </div>
          <div className="rounded-lg bg-stone-800 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Tiempo Estimado
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              {formatDuration(route.totalDuration)}
            </p>
          </div>
          <div className="col-span-2 rounded-lg bg-stone-800 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Consumo Estimado
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-lg font-bold text-amber-400">
                {route.fuelConsumption.toFixed(1)} L
              </p>
            </div>
          </div>
        </div>

        {/* Legs summary */}
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 pl-1">Tramos del Viaje</p>
          <div className="space-y-1.5">
            {route.legs.map((leg, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-stone-800/50 p-2.5 transition-colors hover:bg-stone-800/80">
                
                <div className="flex min-w-0 flex-1 flex-col gap-1 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-stone-700 text-[9px] font-bold text-stone-300">
                      {i + 1}
                    </div>
                    <span className="truncate text-xs text-stone-300" title={leg.from}>{leg.from}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-[9px] font-bold text-indigo-400">
                      {i + 2}
                    </div>
                    <span className="truncate text-xs font-medium text-indigo-300" title={leg.to}>{leg.to}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5 border-l border-stone-700/50 pl-3">
                  <span className="text-[11px] font-medium text-stone-400">
                    {formatDistance(leg.distance)}
                  </span>
                  
                  <div className="flex gap-1">
                    <a
                      href={googleMapsLink({ destinations: [route.orderedDestinations[i], route.orderedDestinations[i + 1]], useGpsOrigin: false })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded bg-blue-600/20 p-1 text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
                      title="Google Maps"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </a>
                    <a
                      href={wazeLink({ destinations: [route.orderedDestinations[i + 1]] })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded bg-sky-600/20 p-1 text-sky-400 transition-colors hover:bg-sky-600 hover:text-white"
                      title="Waze"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.44 2H6.56C3.99 2 2 3.99 2 6.56v10.88C2 20.01 3.99 22 6.56 22h10.88c2.57 0 4.56-1.99 4.56-4.56V6.56C22 3.99 20.01 2 17.44 2zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm0-12c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <a
            href={googleMapsLink({ destinations: route.orderedDestinations })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold tracking-wider text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Abrir Ruta en Maps
          </a>
          <button
            onClick={onShare}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-bold tracking-wider text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartir Enlace
          </button>
          <button
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-600 bg-transparent py-2.5 text-sm font-medium text-stone-300 transition-all hover:bg-stone-800 hover:text-white active:scale-[0.98]"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Nueva Búsqueda
          </button>
        </div>
      </div>
    </div>
  )
}
