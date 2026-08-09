import { type DragEndEvent, DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Destination } from '../lib/types'

interface DestinationListProps {
  destinations: Destination[]
  onRemove: (id: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
  onFocus: (dest: Destination) => void
  onTogglePin: (id: string) => void
  focusedId: string | null
  maxWarn?: boolean
}

function SortableItem({
  dest,
  index,
  onRemove,
  onFocus,
  onTogglePin,
  isFocused,
}: {
  dest: Destination
  index: number
  onRemove: (id: string) => void
  onFocus: (dest: Destination) => void
  onTogglePin: (id: string) => void
  isFocused: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dest.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const baseClasses = "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300"
  let activeClasses = isFocused ? "bg-stone-700/80 ring-1 shadow-lg scale-[1.02] " : "hover:bg-stone-700/50 "
  
  if (dest.isPinned) {
    activeClasses += isFocused ? "ring-amber-500 shadow-amber-900/20" : "bg-amber-900/10 border border-amber-900/30"
  } else {
    activeClasses += isFocused ? "ring-indigo-500 shadow-indigo-900/20" : ""
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => onFocus(dest)}
      className={`${baseClasses} ${activeClasses}`}
      {...attributes}
      {...listeners}
    >
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors duration-300 ${dest.isPinned ? 'bg-amber-600' : isFocused ? 'bg-indigo-500' : 'bg-indigo-600'}`}>
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate text-sm transition-colors duration-300 ${isFocused || dest.isPinned ? 'text-white font-medium' : 'text-stone-200'}`}>{dest.name}</p>
          {dest.isPinned && (
            <svg className="size-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
        <p className={`text-xs transition-colors duration-300 ${isFocused ? 'text-stone-400' : 'text-stone-500'}`}>
          {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(dest.id)
          }}
          className={`shrink-0 rounded p-1.5 transition-colors ${dest.isPinned ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-white' : 'text-stone-500 hover:bg-stone-700 hover:text-stone-300'}`}
          title={dest.isPinned ? "Desfijar (Permitir optimizar)" : "Fijar al inicio (No cambiar de lugar)"}
          aria-label={dest.isPinned ? `Desfijar ${dest.name}` : `Fijar ${dest.name}`}
        >
          <svg className="size-4" fill={dest.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(dest.id)
          }}
          className="shrink-0 rounded p-1.5 text-stone-500 transition-colors hover:bg-red-600 hover:text-white"
          title="Eliminar"
          aria-label={`Eliminar ${dest.name}`}
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  )
}

export default function DestinationList({
  destinations,
  onRemove,
  onReorder,
  onFocus,
  onTogglePin,
  focusedId,
  maxWarn,
}: DestinationListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={destinations.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1">
            {destinations.map((dest, i) => (
              <SortableItem key={dest.id} dest={dest} index={i} onRemove={onRemove} onFocus={onFocus} onTogglePin={onTogglePin} isFocused={dest.id === focusedId} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  )
}
