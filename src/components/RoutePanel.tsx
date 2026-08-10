import type { Destination, RouteResult } from '../lib/types'
import { googleMapsLink, wazeLink } from '../lib/maps-links'

interface RoutePanelProps {
  destinations?: Destination[]
  route?: RouteResult | null
  loading?: boolean
  onOptimize?: () => void
  onShare?: () => void
  onReset?: () => void
  shareFeedback?: string | null
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

export default function RoutePanel({ destinations, route, loading, onOptimize, onShare, onReset, shareFeedback }: RoutePanelProps) {
  if (!route) {
    const ready = destinations && destinations.length >= 2
    return (
      <div className="space-y-3" aria-busy={loading || undefined}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5-2V6l5 2m0 12l6-2m-6 2V8m6 10l5 2V6l-5-2m0 14V4m0 0L9 8" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Planificador</p>
              <p className="mt-1 text-sm font-medium text-stone-100">Ordená tus paradas en segundos</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">Calculamos el recorrido más eficiente para que aproveches mejor cada viaje.</p>
            </div>
          </div>
        </div>
        {!ready && destinations && (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-center text-xs text-stone-500">
            Agregá al menos 2 destinos para optimizar la ruta
          </div>
        )}
        <button
          type="button"
          disabled={!ready || loading}
          onClick={() => onOptimize?.()}
          className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191a19]
            ${
              ready && !loading
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 hover:bg-indigo-400 hover:shadow-indigo-900/50 active:scale-[0.98]'
                : 'cursor-not-allowed bg-white/5 text-stone-600'
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
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Resultado</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-100">Ruta optimizada</h2>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          Lista
        </span>
      </div>

      {/* Route metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.045] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">Distancia</p>
          <p className="mt-1 text-lg font-bold text-indigo-300">{formatDistance(route.totalDistance)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.045] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">Tiempo</p>
          <p className="mt-1 text-lg font-bold text-emerald-300">{formatDuration(route.totalDuration)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.045] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">Combustible</p>
          <p className="mt-1 text-lg font-bold text-amber-300">{route.fuelConsumption.toFixed(1)} L</p>
        </div>
      </div>

      {/* Legs summary */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">Tramos del viaje</p>
          <span className="text-[10px] text-stone-600">{route.legs.length} tramos</span>
        </div>
        <div className="space-y-2">
          {route.legs.map((leg, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.035] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.06]">
              <div className="flex min-w-0 flex-1 flex-col gap-2 pr-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-700 text-[9px] font-bold text-stone-300">
                    {i + 1}
                  </div>
                  <span className="truncate text-xs text-stone-300" title={leg.from}>{leg.from}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-bold text-indigo-300">
                    {i + 2}
                  </div>
                  <span className="truncate text-xs font-medium text-indigo-200" title={leg.to}>{leg.to}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 border-l border-white/10 pl-3">
                <span className="text-[10px] font-medium text-stone-400">
                  {formatDistance(leg.distance)} · {formatDuration(leg.duration)}
                </span>

                <div className="flex gap-1">
                    <a
                      href={googleMapsLink({ destinations: [route.orderedDestinations[i], route.orderedDestinations[i + 1]], useGpsOrigin: false })}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir tramo ${leg.from} a ${leg.to} en Google Maps`}
                      className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 p-1 text-blue-300 transition-colors hover:bg-blue-500 hover:text-white"
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
                      aria-label={`Navegar a ${leg.to} con Waze`}
                      className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 p-1 text-sky-300 transition-colors hover:bg-sky-500 hover:text-white"
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
      </section>

      <div className="flex flex-col gap-2">
          <a
            href={googleMapsLink({ destinations: route.orderedDestinations })}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir la ruta completa en Google Maps"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-blue-950/30 transition-all hover:bg-blue-400 active:scale-[0.98]"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Abrir Ruta en Maps
          </a>
          <button
            type="button"
            onClick={onShare}
            aria-label="Compartir enlace de la ruta"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-violet-950/30 transition-all hover:bg-violet-400 active:scale-[0.98]"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartir Enlace
          </button>
          {shareFeedback && (
            <p className="text-center text-xs text-emerald-400">{shareFeedback}</p>
          )}
          <button
            type="button"
            onClick={onReset}
            aria-label="Empezar una nueva búsqueda"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent py-3 text-sm font-medium text-stone-300 transition-all hover:border-white/25 hover:bg-white/5 hover:text-white active:scale-[0.98]"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Nueva Búsqueda
          </button>
      </div>
    </div>
  )
}
