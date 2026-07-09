import { type DragEndEvent, DndContext, closestCenter } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Destination } from '../lib/types'

interface DestinationListProps {
  destinations: Destination[]
  onRemove: (id: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
  maxWarn?: boolean
}

function SortableItem({
  dest,
  index,
  onRemove,
}: {
  dest: Destination
  index: number
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dest.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-stone-700/50"
      {...attributes}
      {...listeners}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-stone-200">{dest.name}</p>
        <p className="text-xs text-stone-500">
          {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(dest.id)
        }}
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
  )
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = destinations.findIndex((d) => d.id === active.id)
    const newIndex = destinations.findIndex((d) => d.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(oldIndex, newIndex)
  }

  return (
    <>
      {maxWarn && (
        <p className="mb-2 rounded bg-amber-900/50 px-3 py-1.5 text-xs text-amber-300">
          Máximo de {destinations.length} destinos alcanzado
        </p>
      )}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={destinations.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1">
            {destinations.map((dest, i) => (
              <SortableItem key={dest.id} dest={dest} index={i} onRemove={onRemove} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  )
}
