import type { Destination } from '../lib/types'

interface DestinationListProps {
  destinations: Destination[]
  onRemove: (id: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
  maxWarn?: boolean
}

export default function DestinationList({
  destinations,
  onRemove,
  onReorder,
  maxWarn,
}: DestinationListProps) {
  if (destinations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">
        Buscá destinos para agregar al mapa
      </p>
    )
  }

  return (
    <>
      {maxWarn && (
        <p className="mb-2 rounded bg-amber-900/50 px-3 py-1.5 text-xs text-amber-300">
          Máximo de {destinations.length} destinos alcanzado
        </p>
      )}
      <ul className="space-y-1">
      {destinations.map((dest, i) => (
        <li
          key={dest.id}
          className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-stone-700/50"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', String(i))
            ;(e.currentTarget as HTMLElement).classList.add('opacity-50')
          }}
          onDragEnd={(e) => {
            ;(e.currentTarget as HTMLElement).classList.remove('opacity-50')
          }}
          onDragOver={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).classList.add('ring-1', 'ring-indigo-500')
          }}
          onDragLeave={(e) => {
            ;(e.currentTarget as HTMLElement).classList.remove('ring-1', 'ring-indigo-500')
          }}
          onDrop={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).classList.remove('ring-1', 'ring-indigo-500')
            const from = Number(e.dataTransfer.getData('text/plain'))
            if (!isNaN(from) && from !== i) onReorder(from, i)
          }}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {i + 1}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-stone-200">{dest.name}</p>
            <p className="text-xs text-stone-500">
              {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
            </p>
          </div>

          <button
            onClick={() => onRemove(dest.id)}
            className="shrink-0 rounded p-1 text-stone-500 transition-all hover:bg-red-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
            title="Eliminar"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </li>
      ))}
    </ul>
    </>
  )
}
