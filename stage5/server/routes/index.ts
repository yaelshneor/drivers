import { Router } from 'express';
import { query } from '../db/pool.js';
import { regionsRouter, sitesRouter, stopsRouter } from './catalog.js';
import { driversRouter } from './drivers.js';
import { routesRouter } from './routes.js';
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

apiRouter.use('/drivers', driversRouter);
apiRouter.use('/routes', routesRouter);
apiRouter.use('/regions', regionsRouter);
apiRouter.use('/sites', sitesRouter);
apiRouter.use('/stops', stopsRouter);
apiRouter.use('/trips', tripsRouter);
