import { RouteOption } from '../types';
import { apiGet } from './client';

export function fetchRoutes(): Promise<RouteOption[]> {
  return apiGet<RouteOption[]>('/api/routes');
}
