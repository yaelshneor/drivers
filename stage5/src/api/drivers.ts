import { Driver, DriverRegionActivity } from '../types';
import { apiDelete, apiGet, apiPost, apiPut } from './client';

export function fetchDrivers(): Promise<Driver[]> {
  return apiGet<Driver[]>('/api/drivers');
}

export function fetchDriverById(id: string): Promise<Driver> {
  return apiGet<Driver>(`/api/drivers/${encodeURIComponent(id)}`);
}

export function fetchDriverRegionActivity(id: string): Promise<DriverRegionActivity> {
  return apiGet<DriverRegionActivity>(`/api/drivers/${encodeURIComponent(id)}/region-activity`);
}

export function createDriver(driver: Driver): Promise<Driver> {
  return apiPost<Driver>('/api/drivers', {
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    licensetype: driver.licensetype,
  });
}

export function updateDriverApi(driver: Driver): Promise<Driver> {
  return apiPut<Driver>(`/api/drivers/${encodeURIComponent(driver.id)}`, {
    name: driver.name,
    phone: driver.phone,
    licensetype: driver.licensetype,
  });
}

export function deleteDriverApi(id: string): Promise<void> {
  return apiDelete(`/api/drivers/${encodeURIComponent(id)}`);
}
