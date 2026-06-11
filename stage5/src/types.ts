export interface Driver {
  id: string;
  name: string;
  phone: string;
  licensetype: string;
  totalTrips?: number;
}

export interface DriverRegionActivity {
  driverName: string;
  topRegionName: string | null;
  tripCount: number;
  routeCount: number;
  status: string;
}

export interface Trip {
  id: string;
  driverId: string;
  date: string;
  time: string;
  destination: string;
  route: string;
  stops: string[];
  busId: string;
  departureStation: string;
  status: 'scheduled' | 'pending_cancellation' | 'cancelled' | 'cancellation_rejected';
}

export interface BusOption {
  id: string;
  licensePlate: string;
  capacity: number;
  manufacturer: string;
  model: string;
  year: number;
  vehicleType?: string;
}

export interface VehicleCreateInput {
  licensePlate: string;
  capacity: number;
  manufacturer: string;
  model: string;
  year: number;
  vehicleType: string;
}

export interface RouteOption {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  durationMinutes: number;
  distanceKm: number;
  regionId: string;
  regionName: string;
  stops: string[];
}

export interface RegionOption {
  id: string;
  name: string;
  terrainType: string;
}

export interface SiteOption {
  name: string;
  siteType: string;
  address: string;
}

export interface StopOption {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  siteName: string | null;
}

export interface RouteStopInput {
  stopId?: string;
  stopName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  siteName?: string | null;
  arrivalTime: string;
}

export interface RouteCreateInput {
  routeName: string;
  startLocation: string;
  endLocation: string;
  durationMinutes: number;
  distanceKm: number;
  regionId: string;
  stops: RouteStopInput[];
}

export interface TripAssignment {
  driverId: string;
  busId: string;
  routeId: string;
  date: string;
  time: string;
}

export interface CancellationRequest {
  id: string;
  tripId: string;
  driverId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}
