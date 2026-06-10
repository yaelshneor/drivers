import { Router } from 'express';
import { query } from '../db/pool.js';

export const regionsRouter = Router();
export const sitesRouter = Router();
export const stopsRouter = Router();

regionsRouter.get('/', async (_req, res) => {
  try {
    const result = await query<{
      region_id: number;
      regio_name: string;
      terrain_type: string;
    }>('SELECT region_id, regio_name, terrain_type FROM region ORDER BY regio_name');
    return res.json(
      result.rows.map((row) => ({
        id: String(row.region_id),
        name: row.regio_name,
        terrainType: row.terrain_type,
      })),
    );
  } catch (err) {
    console.error('GET /api/regions', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

sitesRouter.get('/', async (_req, res) => {
  try {
    const result = await query<{
      site_name: string;
      site_type: string;
      address: string | null;
    }>('SELECT site_name, site_type, address FROM site ORDER BY site_name');
    return res.json(
      result.rows.map((row) => ({
        name: row.site_name,
        siteType: row.site_type,
        address: row.address ?? '',
      })),
    );
  } catch (err) {
    console.error('GET /api/sites', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

stopsRouter.get('/', async (_req, res) => {
  try {
    const result = await query<{
      stop_id: number;
      stop_name: string;
      address: string;
      latitude: string;
      longitude: string;
      site_name: string | null;
    }>(
      `SELECT stop_id, stop_name, address, latitude, longitude, site_name
       FROM stop ORDER BY stop_name`,
    );
    return res.json(
      result.rows.map((row) => ({
        id: String(row.stop_id),
        name: row.stop_name,
        address: row.address,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        siteName: row.site_name,
      })),
    );
  } catch (err) {
    console.error('GET /api/stops', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});
