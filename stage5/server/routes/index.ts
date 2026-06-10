import { Router } from 'express';
import { query } from '../db/pool.js';
import { driversRouter } from './drivers.js';
import { tripsRouter } from './trips.js';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('GET /api/health', err);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

apiRouter.get('/buses', async (_req, res) => {
  try {
    const result = await query<{
      busid: number;
      licenseplate: number;
      capacity: number;
      manufacturer: string;
      model: string;
      year: number;
    }>(
      `SELECT busid, licenseplate, capacity, manufacturer, model, year
       FROM bus ORDER BY busid`,
    );
    return res.json(
      result.rows.map((row) => ({
        id: String(row.busid),
        licensePlate: String(row.licenseplate),
        capacity: row.capacity,
        manufacturer: row.manufacturer,
        model: row.model,
        year: row.year,
      })),
    );
  } catch (err) {
    console.error('GET /api/buses', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

apiRouter.get('/routes', async (_req, res) => {
  try {
    const result = await query<{
      route_id: number;
      route_name: string;
      start_location: string;
      end_location: string;
      estimated_duration_minutes: number;
      total_distance_km: number;
      stops: string[] | null;
    }>(
      `SELECT r.route_id, r.route_name, r.start_location, r.end_location,
              r.estimated_duration_minutes, r.total_distance_km,
              (
                SELECT COALESCE(array_agg(s.stop_name ORDER BY rs.stop_order), ARRAY[]::varchar[])
                FROM route_stop rs
                JOIN stop s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = r.route_id
              ) AS stops
       FROM route r
       ORDER BY r.route_id`,
    );
    return res.json(
      result.rows.map((row) => ({
        id: String(row.route_id),
        name: row.route_name,
        startLocation: row.start_location,
        endLocation: row.end_location,
        durationMinutes: row.estimated_duration_minutes,
        distanceKm: row.total_distance_km,
        stops: row.stops ?? [],
      })),
    );
  } catch (err) {
    console.error('GET /api/routes', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

apiRouter.use('/drivers', driversRouter);
apiRouter.use('/trips', tripsRouter);
