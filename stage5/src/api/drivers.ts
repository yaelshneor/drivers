import { Driver } from '../types';
import { apiGet } from './client';

export function fetchDriverById(id: string): Promise<Driver> {
  return apiGet<Driver>(`/api/drivers/${encodeURIComponent(id)}`);
}
