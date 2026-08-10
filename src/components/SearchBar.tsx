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

    if (value.trim().length < 2) {
      abortRef.current?.abort()
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }

    timerRef.current = setTimeout(() => search(value), DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

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
          aria-autocomplete="list"
          aria-controls="destination-suggestions"
          aria-expanded={open}
          autoComplete="off"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (e.key === 'Enter' && open && suggestions[0]) {
              e.preventDefault()
              handleSelect(suggestions[0])
            }
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="h-11 w-full rounded-xl border border-white/10 bg-[#222422] px-4 py-2.5 pl-10 text-sm text-stone-100 placeholder-stone-500 outline-none transition-colors focus:border-indigo-400/70 focus:bg-[#282a28] focus:ring-2 focus:ring-indigo-500/20"
        />
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500"
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
            <div className="size-4 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-xs text-red-300">{error}</p>
      )}

      {open && suggestions.length > 0 && (
        <ul id="destination-suggestions" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#202220] shadow-2xl shadow-black/30">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat ?? 'x'}-${s.lng ?? 'x'}-${i}`}
              className="border-b border-white/5 last:border-b-0"
            >
              <button
                type="button"
                role="option"
                aria-selected="false"
                onPointerDown={(event) => {
                  event.preventDefault()
                  handleSelect(s)
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-200 transition-colors hover:bg-indigo-500/10 focus-visible:bg-indigo-500/10"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {searched && !open && suggestions.length === 0 && query.trim().length >= 2 && (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-stone-400">
          <p>Sin resultados para <span className="font-medium text-stone-300">"{query}"</span></p>
          <p className="mt-0.5 text-stone-500">
            El buscador reconoce calles, avenidas y lugares, pero no números de calle. Probá con el nombre de la calle sin número.
          </p>
        </div>
      )}
    </div>
  )
}
