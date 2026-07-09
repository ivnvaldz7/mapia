import { FUEL_LITERS_PER_100KM } from './constants'

export function estimateFuelConsumption(distanceMeters: number, efficiencyLitersPer100Km: number = FUEL_LITERS_PER_100KM): number {
  const distanceKm = distanceMeters / 1000;
  return (distanceKm * efficiencyLitersPer100Km) / 100;
}
