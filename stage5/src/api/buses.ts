import { BusOption } from '../types';
import { apiGet } from './client';

export function fetchBuses(): Promise<BusOption[]> {
  return apiGet<BusOption[]>('/api/buses');
}
