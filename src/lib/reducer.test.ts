import { describe, it, expect } from 'vitest'
import { reducer, initialState } from './reducer'
import type { Destination } from './types'

const dest = (id: string, extra: Partial<Destination> = {}): Destination => ({
  id,
  name: `Dest ${id}`,
  lat: -34.6,
  lng: -58.4,
  ...extra,
})

describe('reducer', () => {
  it('adds a destination', () => {
    const state = reducer(initialState, { type: 'ADD_DESTINATION', payload: dest('1') })
    expect(state.destinations).toHaveLength(1)
    expect(state.destinations[0].id).toBe('1')
  })

  it('removes a destination by id', () => {
    const base = { ...initialState, destinations: [dest('1'), dest('2')] }
    const state = reducer(base, { type: 'REMOVE_DESTINATION', payload: '1' })
    expect(state.destinations.map((d) => d.id)).toEqual(['2'])
  })

  it('replaces destinations with SET_DESTINATIONS', () => {
    const state = reducer(initialState, { type: 'SET_DESTINATIONS', payload: [dest('1'), dest('2')] })
    expect(state.destinations).toHaveLength(2)
  })

  it('toggles pin on a single destination', () => {
    const base = { ...initialState, destinations: [dest('1'), dest('2')] }
    const pinned = reducer(base, { type: 'TOGGLE_PIN', payload: '1' })
    expect(pinned.destinations[0].isPinned).toBe(true)
    expect(pinned.destinations[1].isPinned).toBeUndefined()

    const unpinned = reducer(pinned, { type: 'TOGGLE_PIN', payload: '1' })
    expect(unpinned.destinations[0].isPinned).toBe(false)
  })

  it('sets and clears route', () => {
    const route = {
      orderedDestinations: [dest('1')],
      totalDistance: 1000,
      totalDuration: 600,
      fuelConsumption: 0.8,
      geometry: { type: 'LineString' as const, coordinates: [[-58.4, -34.6]] },
      legs: [],
    }
    const withRoute = reducer(initialState, { type: 'SET_ROUTE', payload: route })
    expect(withRoute.route).toBe(route)

    const cleared = reducer(withRoute, { type: 'SET_ROUTE', payload: null })
    expect(cleared.route).toBeNull()
  })

  it('tracks loading, error and maxWarn flags', () => {
    let state = reducer(initialState, { type: 'SET_LOADING', payload: true })
    expect(state.loading).toBe(true)

    state = reducer(state, { type: 'SET_ERROR', payload: 'boom' })
    expect(state.errorMsg).toBe('boom')

    state = reducer(state, { type: 'SET_MAX_WARN', payload: true })
    expect(state.maxWarn).toBe(true)
  })

  it('RESET returns to initial state', () => {
    const dirty = {
      ...initialState,
      destinations: [dest('1')],
      loading: true,
      errorMsg: 'boom',
      maxWarn: true,
    }
    expect(reducer(dirty, { type: 'RESET' })).toEqual(initialState)
  })
})
