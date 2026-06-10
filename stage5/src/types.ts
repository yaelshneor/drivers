export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseType: string;
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
}

export interface RouteOption {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  durationMinutes: number;
  distanceKm: number;
  stops: string[];
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
