import { Router } from 'express';
import { pool, query } from '../db/pool.js';
import { CONFLICT, duplicateErrorResponse } from '../db/conflictError.js';

const ROUTE_SELECT = `
  SELECT r.route_id, r.route_name, r.start_location, r.end_location,
         r.estimated_duration_minutes, r.total_distance_km, r.region_id,
         reg.regio_name AS region_name,
         (
           SELECT COALESCE(array_agg(s.stop_name ORDER BY rs.stop_order), ARRAY[]::varchar[])
           FROM route_stop rs
           JOIN stop s ON s.stop_id = rs.stop_id
           WHERE rs.route_id = r.route_id
         ) AS stops
  FROM route r
  JOIN region reg ON reg.region_id = r.region_id
`;

type RouteRow = {
  route_id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  estimated_duration_minutes: number;
  total_distance_km: number;
  region_id: number;
  region_name: string;
  stops: string[] | null;
};

function mapRouteRow(row: RouteRow) {
  return {
    id: String(row.route_id),
    name: row.route_name,
    startLocation: row.start_location,
    endLocation: row.end_location,
    durationMinutes: row.estimated_duration_minutes,
    distanceKm: row.total_distance_km,
    regionId: String(row.region_id),
    regionName: row.region_name,
    stops: row.stops ?? [],
  };
}

export const routesRouter = Router();

routesRouter.post('/update-statistics', async (_req, res) => {
  try {
    await query('CALL update_route_statistics()');
    const result = await query<RouteRow>(`${ROUTE_SELECT} ORDER BY r.route_id`);
    return res.json(result.rows.map(mapRouteRow));
  } catch (err) {
    console.error('POST /api/routes/update-statistics', err);
    return res.status(500).json({ error: 'שגיאה בעדכון סטטיסטיקות מסלולים' });
  }
});

routesRouter.get('/', async (_req, res) => {
  try {
    const result = await query<RouteRow>(`${ROUTE_SELECT} ORDER BY r.route_id DESC`);
    return res.json(result.rows.map(mapRouteRow));
  } catch (err) {
    console.error('GET /api/routes', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

routesRouter.post('/', async (req, res) => {
  const {
    routeName,
    startLocation,
    endLocation,
    durationMinutes,
    distanceKm,
    regionId,
    stops,
  } = req.body ?? {};

  const region_id = Number.parseInt(String(regionId), 10);
  const duration = Number.parseInt(String(durationMinutes), 10);
  const distance = Number.parseInt(String(distanceKm), 10);

  if (
    !routeName?.trim() ||
    !startLocation?.trim() ||
    !endLocation?.trim() ||
    Number.isNaN(region_id) ||
    Number.isNaN(duration) ||
    Number.isNaN(distance) ||
    !Array.isArray(stops) ||
    stops.length === 0
  ) {
    return res.status(400).json({ error: 'נתונים חסרים ליצירת מסלול' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const regionCheck = await client.query(
      'SELECT 1 FROM region WHERE region_id = $1',
      [region_id],
    );
    if (!regionCheck.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'אזור לא נמצא' });
    }

    const routeIdResult = await client.query<{ id: number }>(
      'SELECT COALESCE(MAX(route_id), 0) + 1 AS id FROM route',
    );
    const route_id = routeIdResult.rows[0].id;

    await client.query(
      `INSERT INTO route (route_id, route_name, start_location, end_location,
                          estimated_duration_minutes, total_distance_km, created_date, region_id)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)`,
      [
        route_id,
        routeName.trim(),
        startLocation.trim(),
        endLocation.trim(),
        duration,
        distance,
        region_id,
      ],
    );

    let stopOrder = 1;
    for (const stop of stops) {
      const arrivalTime = String(stop.arrivalTime ?? '').trim();
      if (!arrivalTime) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'יש להזין שעת הגעה לכל תחנה' });
      }

      let stop_id: number;
      if (stop.stopId) {
        stop_id = Number.parseInt(String(stop.stopId), 10);
        if (Number.isNaN(stop_id)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'מזהה תחנה לא תקין' });
        }
        const exists = await client.query(
          'SELECT 1 FROM stop WHERE stop_id = $1',
          [stop_id],
        );
        if (!exists.rowCount) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `תחנה ${stop_id} לא נמצאה` });
        }
      } else {
        const stopName = String(stop.stopName ?? '').trim();
        const address = String(stop.address ?? '').trim();
        const latitude = Number.parseFloat(String(stop.latitude));
        const longitude = Number.parseFloat(String(stop.longitude));
        if (!stopName || !address || Number.isNaN(latitude) || Number.isNaN(longitude)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'תחנה חדשה דורשת שם, כתובת, latitude ו-longitude' });
        }
        const siteName = stop.siteName ? String(stop.siteName).trim() : null;
        if (siteName) {
          const siteCheck = await client.query(
            'SELECT 1 FROM site WHERE site_name = $1',
            [siteName],
          );
          if (!siteCheck.rowCount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'אתר לא נמצא' });
          }
        }
        const stopIdResult = await client.query<{ id: number }>(
          'SELECT COALESCE(MAX(stop_id), 0) + 1 AS id FROM stop',
        );
        stop_id = stopIdResult.rows[0].id;
        await client.query(
          `INSERT INTO stop (stop_id, stop_name, address, latitude, longitude, site_name)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [stop_id, stopName, address, latitude, longitude, siteName],
        );
      }

      await client.query(
        `INSERT INTO route_stop (route_id, stop_id, stop_order, estimated_arrival_time)
         VALUES ($1, $2, $3, $4)`,
        [route_id, stop_id, stopOrder++, arrivalTime],
      );
    }

    await client.query('COMMIT');

    const created = await query<RouteRow>(
      `${ROUTE_SELECT} WHERE r.route_id = $1`,
      [route_id],
    );
    return res.status(201).json(mapRouteRow(created.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/routes', err);
    const dup = duplicateErrorResponse(err, CONFLICT.route);
    if (dup) return res.status(dup.status).json({ error: dup.error });
    return res.status(500).json({ error: 'שגיאה ביצירת מסלול' });
  } finally {
    client.release();
  }
});
