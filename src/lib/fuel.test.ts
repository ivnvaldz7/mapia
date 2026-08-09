import { describe, it, expect } from 'vitest'
import { estimateFuelConsumption } from './fuel'
import { FUEL_LITERS_PER_100KM } from './constants'

describe('estimateFuelConsumption', () => {
  it('computes consumption with default efficiency', () => {
    expect(estimateFuelConsumption(100_000)).toBeCloseTo(FUEL_LITERS_PER_100KM)
  })

  it('computes consumption with custom efficiency', () => {
    expect(estimateFuelConsumption(50_000, 10)).toBeCloseTo(5)
  })

  it('returns 0 for zero distance', () => {
    expect(estimateFuelConsumption(0)).toBe(0)
  })

  it('scales linearly with distance', () => {
    const short = estimateFuelConsumption(10_000)
    const long = estimateFuelConsumption(20_000)
    expect(long).toBeCloseTo(short * 2)
  })
})
