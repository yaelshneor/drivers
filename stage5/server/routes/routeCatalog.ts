import { Router } from 'express';
import { query } from '../db/pool.js';

export const routeCatalogRouter = Router();

routeCatalogRouter.get('/', async (_req, res) => {
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
