import type { Destination, RouteResult } from '../lib/types'
import { googleMapsLink, wazeLink } from '../lib/maps-links'

interface RoutePanelProps {
  destinations: Destination[]
  route: RouteResult | null
  loading: boolean
  onOptimize?: () => void
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

export default function RoutePanel({ destinations, route, loading, onOptimize }: RoutePanelProps) {
  if (destinations.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-stone-600 p-4 text-center text-sm text-stone-500">
        Agregá al menos 2 destinos para optimizar la ruta
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Optimize button / Loading */}
      {!route && (
        <button
          disabled={loading}
          onClick={onOptimize}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Calculando…' : 'Optimizar ruta'}
        </button>
      )}

      {/* Route info */}
      {route && (
        <>
          <div className="flex gap-4 rounded-lg bg-stone-800 p-3">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-white">
                {formatDistance(route.totalDistance)}
              </p>
              <p className="text-xs text-stone-400">Distancia</p>
            </div>
            <div className="w-px bg-stone-600" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-white">
                {formatDuration(route.totalDuration)}
              </p>
              <p className="text-xs text-stone-400" title="Tráfico en tiempo real no disponible en versión libre">
                Duración ℹ️
              </p>
            </div>
            <div className="w-px bg-stone-600" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-white">
                {route.fuelConsumption.toFixed(1)} L
              </p>
              <p className="text-xs text-stone-400">Combustible</p>
            </div>
            <div className="w-px bg-stone-600" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-white">
                {route.orderedDestinations.length}
              </p>
              <p className="text-xs text-stone-400">Paradas</p>
            </div>
          </div>

          {/* Legs summary */}
          <div className="space-y-1.5 rounded-lg bg-stone-800/50 p-3">
            <p className="text-xs font-medium text-stone-400">Tramos</p>
            {route.legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-stone-300">
                <span className="shrink-0 text-indigo-400">{leg.from}</span>
                <span className="text-stone-500">→</span>
                <span className="shrink-0 text-indigo-400">{leg.to}</span>
                <span className="ml-auto text-stone-500">
                  {formatDistance(leg.distance)}
                </span>
              </div>
            ))}
          </div>

          {/* Launch buttons */}
          <div className="flex gap-2">
            <a
              href={googleMapsLink({
                origin: route.orderedDestinations[0],
                destinations: route.orderedDestinations,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Google Maps
            </a>
            <a
              href={wazeLink({
                origin: route.orderedDestinations[0],
                destinations: route.orderedDestinations,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.44 2H6.56C3.99 2 2 3.99 2 6.56v10.88C2 20.01 3.99 22 6.56 22h10.88c2.57 0 4.56-1.99 4.56-4.56V6.56C22 3.99 20.01 2 17.44 2zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm0-12c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
              </svg>
              Waze
            </a>
          </div>
        </>
      )}
    </div>
  )
}
