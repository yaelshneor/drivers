import { query } from './pool.js';

export type TripStatus =
  | 'scheduled'
  | 'pending_cancellation'
  | 'cancelled'
  | 'cancellation_rejected';

export function formatDepartureTime(value: number | null): string {
  if (value == null) return '00:00';
  const s = String(value).padStart(4, '0');
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}

export function parseDepartureTime(time: string): number {
  const [h, m] = time.split(':');
  return Number.parseInt(h, 10) * 100 + Number.parseInt(m, 10);
}

export function toUiStatus(dbStatus: string | null): TripStatus {
  switch (dbStatus) {
    case 'Pending Cancellation':
      return 'pending_cancellation';
    case 'Cancelled':
      return 'cancelled';
    case 'Cancellation Rejected':
      return 'cancellation_rejected';
    default:
      return 'scheduled';
  }
}

export function toDbStatus(uiStatus: TripStatus): string {
  switch (uiStatus) {
    case 'pending_cancellation':
      return 'Pending Cancellation';
    case 'cancelled':
      return 'Cancelled';
    case 'cancellation_rejected':
      return 'Cancellation Rejected';
    default:
      return 'Active';
  }
}

export function mapDriverRow(row: {
  driverid: number;
  fullname: string;
  phone: string | null;
  licensetype: string;
}) {
  return {
    id: String(row.driverid),
    name: row.fullname,
    phone: row.phone ?? '',
    licenseType: row.licensetype,
  };
}

type TripRow = {
  trip_id: number;
  driver_id: number;
  trip_date: Date | string;
  departure_time: number | null;
  route_name: string;
  start_location: string;
  end_location: string;
  licenseplate: number | null;
  status: string | null;
  stops: string[] | null;
};

export function mapTripRow(row: TripRow) {
  const date =
    row.trip_date instanceof Date
      ? row.trip_date.toISOString().slice(0, 10)
      : String(row.trip_date).slice(0, 10);

  return {
    id: String(row.trip_id),
    driverId: String(row.driver_id),
    date,
    time: formatDepartureTime(row.departure_time),
    destination: row.end_location,
    route: row.route_name,
    stops: row.stops ?? [],
    busId: row.licenseplate != null ? String(row.licenseplate) : '',
    departureStation: row.start_location,
    status: toUiStatus(row.status),
  };
}

const TRIP_SELECT = `
  SELECT t.trip_id, t.driver_id, t.trip_date, t.departure_time, t.status,
         r.route_name, r.start_location, r.end_location,
         b.licenseplate,
         (
           SELECT COALESCE(array_agg(s.stop_name ORDER BY rs.stop_order), ARRAY[]::varchar[])
           FROM route_stop rs
           JOIN stop s ON s.stop_id = rs.stop_id
           WHERE rs.route_id = t.route_id
         ) AS stops
  FROM trip t
  JOIN route r ON r.route_id = t.route_id
  JOIN bus b ON b.busid = t.bus_id
`;

export async function fetchTrips(driverId?: number) {
  const params: number[] = [];
  let sql = TRIP_SELECT;
  if (driverId != null) {
    sql += ' WHERE t.driver_id = $1';
    params.push(driverId);
  }
  sql += ' ORDER BY t.trip_date DESC, t.departure_time DESC';
  const result = await query<TripRow>(sql, params);
  return result.rows.map(mapTripRow);
}
