import { Trip } from '../types';
import { apiGet, apiPatch, apiPost } from './client';

export function fetchTrips(driverId?: string): Promise<Trip[]> {
  const q = driverId ? `?driverId=${encodeURIComponent(driverId)}` : '';
  return apiGet<Trip[]>(`/api/trips${q}`);
}

export function createTrip(data: {
  driverId: string;
  date: string;
  time: string;
  routeName?: string;
  destination?: string;
}): Promise<Trip> {
  return apiPost<Trip>('/api/trips', data);
}

export function updateTripStatus(
  tripId: string,
  status: Trip['status'],
): Promise<Trip> {
  return apiPatch<Trip>(`/api/trips/${encodeURIComponent(tripId)}/status`, { status });
}
