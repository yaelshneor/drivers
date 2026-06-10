import { Router } from 'express';
import { query } from '../db/pool.js';

export const driversRouter = Router();

driversRouter.get('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'מזהה נהג לא תקין' });
  }

  try {
    const result = await query<{
      driverid: number;
      fullname: string;
      phone: string | null;
      licensetype: string;
      licenseplate: number | null;
      manufacturer: string | null;
      model: string | null;
    }>(
      `SELECT d.driverid, d.fullname, d.phone, d.licensetype,
              b.licenseplate, b.manufacturer, b.model
       FROM driver d
       LEFT JOIN LATERAL (
         SELECT t.bus_id
         FROM trip t
         WHERE t.driver_id = d.driverid
         ORDER BY t.trip_date DESC NULLS LAST
         LIMIT 1
       ) lt ON true
       LEFT JOIN bus b ON b.busid = lt.bus_id
       WHERE d.driverid = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }

    const row = result.rows[0];
    return res.json({
      id: String(row.driverid),
      name: row.fullname,
      phone: row.phone ?? '',
      licensePlate: row.licenseplate != null ? String(row.licenseplate) : row.licensetype,
      busType: row.manufacturer ? `${row.manufacturer} ${row.model ?? ''}`.trim() : '',
    });
  } catch (err) {
    console.error('GET /api/drivers/:id', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});
