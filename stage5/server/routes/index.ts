import { Router } from 'express';
import { query } from '../db/pool.js';
import { driversRouter } from './drivers.js';

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

apiRouter.use('/drivers', driversRouter);
