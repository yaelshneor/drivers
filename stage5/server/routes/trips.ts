import { Router } from 'express';
import { query } from '../db/pool.js';
import {
  fetchTrips,
  parseDepartureTime,
  toDbStatus,
  type TripStatus,
} from '../db/mappers.js';

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
  const { driverId, date, time, routeName, destination } = req.body ?? {};
  const driver_id = Number.parseInt(String(driverId), 10);
  if (Number.isNaN(driver_id) || !date || !time) {
    return res.status(400).json({ error: 'נתונים חסרים לשיבוץ נסיעה' });
  }

  try {
    const routeResult = await query<{ route_id: number }>(
      `SELECT route_id FROM route
       WHERE route_name = $1 OR end_location = $2
       ORDER BY route_id LIMIT 1`,
      [routeName ?? destination, destination ?? routeName],
    );
    if (routeResult.rowCount === 0) {
      return res.status(400).json({ error: 'מסלול לא נמצא' });
    }
    const route_id = routeResult.rows[0].route_id;

    const busResult = await query<{ bus_id: number }>(
      `SELECT bus_id FROM trip WHERE driver_id = $1
       ORDER BY trip_date DESC NULLS LAST LIMIT 1`,
      [driver_id],
    );
    let bus_id: number;
    if (busResult.rowCount) {
      bus_id = busResult.rows[0].bus_id;
    } else {
      const fallback = await query<{ busid: number }>(
        'SELECT busid FROM bus ORDER BY busid LIMIT 1',
      );
      if (!fallback.rowCount) {
        return res.status(400).json({ error: 'לא נמצא אוטובוס במערכת' });
      }
      bus_id = fallback.rows[0].busid;
    }

    const plateResult = await query<{ plate_number: string }>(
      `SELECT plate_number FROM vehicle ORDER BY plate_number LIMIT 1`,
    );
    const plate_number = plateResult.rows[0]?.plate_number ?? null;

    const idResult = await query<{ next_id: number }>(
      'SELECT COALESCE(MAX(trip_id), 0) + 1 AS next_id FROM trip',
    );
    const trip_id = idResult.rows[0].next_id;
    const departure_time = parseDepartureTime(time);

    await query(
      `INSERT INTO trip (trip_id, trip_date, departure_time, available_seats,
                         route_id, plate_number, driver_id, bus_id, status)
       VALUES ($1, $2, $3, 40, $4, $5, $6, $7, 'Active')`,
      [trip_id, date, departure_time, route_id, plate_number, driver_id, bus_id],
    );

    const trips = await fetchTrips();
    return res.status(201).json(trips.find((t) => t.id === String(trip_id)));
  } catch (err) {
    console.error('POST /api/trips', err);
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
