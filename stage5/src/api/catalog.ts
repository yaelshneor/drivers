import { RegionOption, SiteOption, StopOption } from '../types';
import { apiGet } from './client';

export function fetchRegions(): Promise<RegionOption[]> {
  return apiGet<RegionOption[]>('/api/regions');
}

export function fetchSites(): Promise<SiteOption[]> {
  return apiGet<SiteOption[]>('/api/sites');
}

export function fetchStops(): Promise<StopOption[]> {
  return apiGet<StopOption[]>('/api/stops');
}
