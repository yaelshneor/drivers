import { RouteCreateInput, RouteOption } from '../types';
import { apiGet, apiPost } from './client';

export function updateRouteStatistics(): Promise<RouteOption[]> {
  return apiPost<RouteOption[]>('/api/routes/update-statistics', {});
}

export function fetchRoutes(): Promise<RouteOption[]> {
  return apiGet<RouteOption[]>('/api/routes');
}

export function createRoute(data: RouteCreateInput): Promise<RouteOption> {
  return apiPost<RouteOption>('/api/routes', data);
}
