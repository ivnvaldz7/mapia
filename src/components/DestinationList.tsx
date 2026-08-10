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

  const baseClasses = "group flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 transition-all duration-200"
  let activeClasses = isFocused
    ? "border-indigo-400/40 bg-indigo-500/10 shadow-lg shadow-indigo-950/30 "
    : "border-white/5 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.05] "
  
  if (dest.isPinned) {
    activeClasses += isFocused ? "border-amber-400/40 shadow-amber-950/30" : "border-amber-500/20 bg-amber-500/[0.06]"
  } else {
    activeClasses += isFocused ? "shadow-indigo-950/30" : ""
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={() => onFocus(dest)}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault()
          onFocus(dest)
        }
      }}
      tabIndex={0}
      aria-current={isFocused ? 'true' : undefined}
      className={`${baseClasses} min-h-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${activeClasses}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        className="flex size-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg border border-white/10 bg-black/20 text-stone-500 transition-colors hover:border-white/20 hover:text-stone-200 active:cursor-grabbing"
        aria-label={`Reordenar ${dest.name}`}
        title="Arrastrar para reordenar"
      >
        <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="4" r="1" />
          <circle cx="11" cy="4" r="1" />
          <circle cx="5" cy="8" r="1" />
          <circle cx="11" cy="8" r="1" />
          <circle cx="5" cy="12" r="1" />
          <circle cx="11" cy="12" r="1" />
        </svg>
      </button>

      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors duration-300 ${dest.isPinned ? 'bg-amber-500' : isFocused ? 'bg-indigo-500' : 'bg-indigo-600'}`}>
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
        <p className={`text-[11px] transition-colors duration-300 ${isFocused ? 'text-stone-400' : 'text-stone-500'}`}>
          {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(dest.id)
          }}
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${dest.isPinned ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white' : 'text-stone-500 hover:bg-white/10 hover:text-stone-200'}`}
          title={dest.isPinned ? "Desfijar (Permitir optimizar)" : "Fijar al inicio (No cambiar de lugar)"}
          aria-label={dest.isPinned ? `Desfijar ${dest.name}` : `Fijar ${dest.name}`}
        >
          <svg className="size-4" fill={dest.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(dest.id)
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 hover:bg-red-500/20 hover:text-red-300"
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
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-stone-500">
        Buscá una dirección para agregarla al mapa
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
        <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Llegaste al máximo de {destinations.length} destinos
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
