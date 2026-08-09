import { useState, useRef, useCallback, useEffect } from 'react'
import { geocode } from '../lib/ors'
import { DEBOUNCE_MS } from '../lib/constants'
import type { GeocodingResult } from '../lib/ors'

interface SearchBarProps {
  onSelect: (result: GeocodingResult) => void
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setSearched(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setSearched(false)
    try {
      const results = await geocode(q, controller.signal)
      setSuggestions(results)
      setOpen(results.length > 0)
      setError(null)
      setSearched(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setSuggestions([])
      setError(err instanceof Error ? err.message : 'Error al buscar')
      setSearched(true)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setError(null)
    setSearched(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), DEBOUNCE_MS)
  }

  const handleSelect = (result: GeocodingResult) => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    onSelect(result)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar destino…"
          aria-label="Buscar destino"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 pl-10 text-sm text-white placeholder-stone-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-4 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-stone-600 bg-stone-800 shadow-xl">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat ?? 'x'}-${s.lng ?? 'x'}-${i}`}
              onMouseDown={() => handleSelect(s)}
              className="cursor-pointer px-4 py-2.5 text-sm text-stone-200 transition-colors hover:bg-stone-700 first:rounded-t-lg last:rounded-b-lg"
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {searched && !open && suggestions.length === 0 && query.trim().length >= 2 && (
        <div className="mt-1 rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-xs text-stone-400">
          <p>Sin resultados para <span className="font-medium text-stone-300">"{query}"</span></p>
          <p className="mt-0.5 text-stone-500">
            El buscador reconoce calles, avenidas y lugares, pero no números de calle. Probá con el nombre de la calle sin número.
          </p>
        </div>
      )}
    </div>
  )
}
