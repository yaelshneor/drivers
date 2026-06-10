export interface Driver {
  id: string;
  name: string;
  phone: string;
  licensePlate: string;
  busType: string;
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

export interface CancellationRequest {
  id: string;
  tripId: string;
  driverId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}
