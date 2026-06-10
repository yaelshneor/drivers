import { Router } from 'express';
import { query } from '../db/pool.js';

export const busesRouter = Router();

busesRouter.get('/', async (_req, res) => {
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
