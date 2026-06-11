import { BusOption, VehicleCreateInput } from '../types';
import { apiGet, apiPost } from './client';

export function fetchBuses(): Promise<BusOption[]> {
  return apiGet<BusOption[]>('/api/buses');
}

export function createVehicle(data: VehicleCreateInput): Promise<BusOption> {
  return apiPost<BusOption>('/api/vehicles', data);
}
