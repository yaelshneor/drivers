import { Router } from 'express';
import { query } from '../db/pool.js';
import { regionsRouter, sitesRouter, stopsRouter } from './catalog.js';
import { driversRouter } from './drivers.js';
import { routesRouter } from './routes.js';
import { tripsRouter } from './trips.js';
import { vehiclesRouter } from './vehicles.js';

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

apiRouter.use('/buses', vehiclesRouter);
apiRouter.use('/vehicles', vehiclesRouter);
apiRouter.use('/drivers', driversRouter);
apiRouter.use('/routes', routesRouter);
apiRouter.use('/regions', regionsRouter);
apiRouter.use('/sites', sitesRouter);
apiRouter.use('/stops', stopsRouter);
apiRouter.use('/trips', tripsRouter);
