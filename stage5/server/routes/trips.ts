import { Router } from 'express';
import { query } from '../db/pool.js';
import {
  fetchTrips,
  parseDepartureTime,
  toDbStatus,
  type TripStatus,
} from '../db/mappers.js';
import { CONFLICT, duplicateErrorResponse } from '../db/conflictError.js';

export const tripsRouter = Router();

tripsRouter.get('/', async (req, res) => {
  try {
    const driverId = req.query.driverId
      ? Number.parseInt(String(req.query.driverId), 10)
      : undefined;
    if (driverId != null && Number.isNaN(driverId)) {
      return res.status(400).json({ error: 'מזהה נהג לא תקין' });
    }
    const trips = await fetchTrips(driverId);
    return res.json(trips);
  } catch (err) {
    console.error('GET /api/trips', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

tripsRouter.post('/', async (req, res) => {
  const { driverId, busId, routeId, date, time } = req.body ?? {};
  const driver_id = Number.parseInt(String(driverId), 10);
  const bus_id = Number.parseInt(String(busId), 10);
  const route_id = Number.parseInt(String(routeId), 10);
  if (
    Number.isNaN(driver_id) ||
    Number.isNaN(bus_id) ||
    Number.isNaN(route_id) ||
    !date ||
    !time
  ) {
    return res.status(400).json({ error: 'נתונים חסרים לשיבוץ נסיעה' });
  }

  try {
    const vehicleResult = await query<{ capacity: number; licenseplate: number }>(
      'SELECT capacity, licenseplate FROM bus WHERE busid = $1',
      [bus_id],
    );
    if (!vehicleResult.rowCount) {
      return res.status(400).json({ error: 'אוטובוס לא נמצא' });
    }

    const routeCheck = await query('SELECT 1 FROM route WHERE route_id = $1', [route_id]);
    if (!routeCheck.rowCount) {
      return res.status(400).json({ error: 'מסלול לא נמצא' });
    }

    const plate_number = String(vehicleResult.rows[0].licenseplate);

    const idResult = await query<{ next_id: number }>(
      'SELECT COALESCE(MAX(trip_id), 0) + 1 AS next_id FROM trip',
    );
    const trip_id = idResult.rows[0].next_id;
    const departure_time = parseDepartureTime(time);
    const available_seats = vehicleResult.rows[0].capacity;

    await query(
      `INSERT INTO trip (trip_id, trip_date, departure_time, available_seats,
                         route_id, plate_number, driver_id, bus_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active')`,
      [
        trip_id,
        date,
        departure_time,
        available_seats,
        route_id,
        plate_number,
        driver_id,
        bus_id,
      ],
    );

    const trips = await fetchTrips();
    const created = trips.find((t) => t.id === String(trip_id));
    if (!created) {
      return res.status(201).json({ id: String(trip_id) });
    }
    return res.status(201).json(created);
  } catch (err) {
    console.error('POST /api/trips', err);
    const pgMsg = err instanceof Error ? err.message : '';
    if (pgMsg.includes('does not exist')) {
      return res.status(400).json({ error: 'נהג לא קיים — לא ניתן לבצע שיבוץ' });
    }
    const dup = duplicateErrorResponse(err, CONFLICT.trip);
    if (dup) return res.status(dup.status).json({ error: dup.error });
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

tripsRouter.patch('/:id/status', async (req, res) => {
  const trip_id = Number.parseInt(req.params.id, 10);
  const { status } = req.body ?? {};
  if (Number.isNaN(trip_id) || !status) {
    return res.status(400).json({ error: 'נתונים לא תקינים' });
  }

  try {
    await query('UPDATE trip SET status = $1 WHERE trip_id = $2', [
      toDbStatus(status as TripStatus),
      trip_id,
    ]);
    const trips = await fetchTrips();
    return res.json(trips.find((t) => t.id === String(trip_id)));
  } catch (err) {
    console.error('PATCH /api/trips/:id/status', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});
