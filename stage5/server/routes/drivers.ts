import { Router } from 'express';
import { query } from '../db/pool.js';
import { mapDriverRow } from '../db/mappers.js';

const DRIVER_SELECT = `
  SELECT d.driverid, d.fullname, d.phone, d.licensetype,
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
`;

export const driversRouter = Router();

driversRouter.get('/license-types', async (_req, res) => {
  try {
    const result = await query<{ licensetype: string }>(
      `SELECT DISTINCT licensetype FROM driver ORDER BY licensetype`,
    );
    return res.json(result.rows.map((row) => row.licensetype));
  } catch (err) {
    console.error('GET /api/drivers/license-types', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

driversRouter.get('/', async (_req, res) => {
  try {
    const result = await query<{
      driverid: number;
      fullname: string;
      phone: string | null;
      licensetype: string;
      licenseplate: number | null;
      manufacturer: string | null;
      model: string | null;
    }>(`${DRIVER_SELECT} ORDER BY d.driverid`);
    return res.json(result.rows.map(mapDriverRow));
  } catch (err) {
    console.error('GET /api/drivers', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

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
    }>(`${DRIVER_SELECT} WHERE d.driverid = $1`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }

    return res.json(mapDriverRow(result.rows[0]));
  } catch (err) {
    console.error('GET /api/drivers/:id', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

driversRouter.post('/', async (req, res) => {
  const { id, name, phone, licenseType } = req.body ?? {};
  const driverid = Number.parseInt(String(id), 10);
  if (Number.isNaN(driverid) || !name || !licenseType) {
    return res.status(400).json({ error: 'נתונים לא תקינים' });
  }

  try {
    await query(
      `INSERT INTO driver (driverid, fullname, phone, licensetype)
       VALUES ($1, $2, $3, $4)`,
      [driverid, name, phone ?? null, licenseType],
    );
    const result = await query<{
      driverid: number;
      fullname: string;
      phone: string | null;
      licensetype: string;
      licenseplate: number | null;
      manufacturer: string | null;
      model: string | null;
    }>(`${DRIVER_SELECT} WHERE d.driverid = $1`, [driverid]);
    return res.status(201).json(mapDriverRow(result.rows[0]));
  } catch (err) {
    console.error('POST /api/drivers', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

driversRouter.put('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { name, phone, licenseType } = req.body ?? {};
  if (Number.isNaN(id) || !name || !licenseType) {
    return res.status(400).json({ error: 'נתונים לא תקינים' });
  }

  try {
    const updated = await query(
      `UPDATE driver SET fullname = $1, phone = $2, licensetype = $3
       WHERE driverid = $4`,
      [name, phone ?? null, licenseType, id],
    );
    if (updated.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }
    const result = await query<{
      driverid: number;
      fullname: string;
      phone: string | null;
      licensetype: string;
      licenseplate: number | null;
      manufacturer: string | null;
      model: string | null;
    }>(`${DRIVER_SELECT} WHERE d.driverid = $1`, [id]);
    return res.json(mapDriverRow(result.rows[0]));
  } catch (err) {
    console.error('PUT /api/drivers/:id', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

driversRouter.delete('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'מזהה נהג לא תקין' });
  }

  try {
    const deleted = await query('DELETE FROM driver WHERE driverid = $1', [id]);
    if (deleted.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/drivers/:id', err);
    return res.status(500).json({ error: 'שגיאה במחיקה — ייתכן שיש נסיעות משויכות' });
  }
});
