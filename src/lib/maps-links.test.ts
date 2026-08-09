import { describe, it, expect } from 'vitest'
import { googleMapsLink, wazeLink } from './maps-links'
import type { Destination } from './types'

const dest = (id: string, lat: number, lng: number): Destination => ({ id, name: id, lat, lng })

const a = dest('a', -34.6, -58.4)
const b = dest('b', -34.7, -58.5)
const c = dest('c', -34.8, -58.6)

describe('googleMapsLink', () => {
  it('returns base maps URL for empty list', () => {
    expect(googleMapsLink({ destinations: [] })).toBe('https://www.google.com/maps')
  })

  it('navigates directly for a single destination', () => {
    const url = new URL(googleMapsLink({ destinations: [a] }))
    expect(url.searchParams.get('destination')).toBe(`${a.lat},${a.lng}`)
    expect(url.searchParams.get('dir_action')).toBe('navigate')
    expect(url.searchParams.get('origin')).toBeNull()
  })

  it('omits origin for multi-stop routes (GPS origin)', () => {
    const url = new URL(googleMapsLink({ destinations: [a, b, c] }))
    expect(url.searchParams.get('origin')).toBeNull()
    expect(url.searchParams.get('destination')).toBe(`${c.lat},${c.lng}`)
    expect(url.searchParams.get('waypoints')).toBe(`${a.lat},${a.lng}|${b.lat},${b.lng}`)
    expect(url.searchParams.get('dir_action')).toBeNull()
  })

  it('uses explicit origin and navigate action when useGpsOrigin is false', () => {
    const url = new URL(googleMapsLink({ destinations: [a, b, c], useGpsOrigin: false }))
    expect(url.searchParams.get('origin')).toBe(`${a.lat},${a.lng}`)
    expect(url.searchParams.get('destination')).toBe(`${c.lat},${c.lng}`)
    expect(url.searchParams.get('dir_action')).toBe('navigate')
    expect(url.searchParams.get('waypoints')).toBe(`${b.lat},${b.lng}`)
  })

  it('handles two stops with explicit origin', () => {
    const url = new URL(googleMapsLink({ destinations: [a, b], useGpsOrigin: false }))
    expect(url.searchParams.get('origin')).toBe(`${a.lat},${a.lng}`)
    expect(url.searchParams.get('destination')).toBe(`${b.lat},${b.lng}`)
    expect(url.searchParams.get('waypoints')).toBeNull()
  })
})

describe('wazeLink', () => {
  it('returns base waze URL for empty list', () => {
    expect(wazeLink({ destinations: [] })).toBe('https://www.waze.com/ul')
  })

  it('navigates to the last destination', () => {
    const url = new URL(wazeLink({ destinations: [a, b] }))
    expect(url.searchParams.get('ll')).toBe(`${b.lat},${b.lng}`)
    expect(url.searchParams.get('navigate')).toBe('yes')
  })
})
