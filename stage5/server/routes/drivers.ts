import { Router } from 'express';
import { query } from '../db/pool.js';
import { LICENSE_TYPES, isValidLicenseType } from '../constants/licenseTypes.js';
import { mapDriverRow } from '../db/mappers.js';

const DRIVER_SELECT = `
  SELECT driverid, fullname, phone, licensetype
  FROM driver
`;

type DriverRow = {
  driverid: number;
  fullname: string;
  phone: string | null;
  licensetype: string;
};

export const driversRouter = Router();

driversRouter.get('/license-types', (_req, res) => {
  return res.json([...LICENSE_TYPES]);
});

driversRouter.get('/', async (_req, res) => {
  try {
    const result = await query<DriverRow>(`${DRIVER_SELECT} ORDER BY driverid`);
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
    const result = await query<DriverRow>(
      `${DRIVER_SELECT} WHERE driverid = $1`,
      [id],
    );

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
  const { id, name, phone } = req.body ?? {};
  const type = String(req.body?.licensetype ?? req.body?.licenseType ?? '').trim();
  const driverid = Number.parseInt(String(id), 10);
  if (Number.isNaN(driverid) || !name?.trim() || !type) {
    return res.status(400).json({ error: 'נתונים לא תקינים — יש למלא שם, מזהה וסוג רישיון' });
  }
  if (!isValidLicenseType(type)) {
    return res.status(400).json({ error: 'סוג רישיון לא תקין' });
  }

  try {
    await query(
      `INSERT INTO driver (driverid, fullname, phone, licensetype)
       VALUES ($1, $2, $3, $4)`,
      [driverid, name.trim(), phone?.trim() || null, type],
    );
    const result = await query<DriverRow>(
      `${DRIVER_SELECT} WHERE driverid = $1`,
      [driverid],
    );
    return res.status(201).json(mapDriverRow(result.rows[0]));
  } catch (err) {
    console.error('POST /api/drivers', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

driversRouter.put('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const { name, phone } = req.body ?? {};
  const type = String(req.body?.licensetype ?? req.body?.licenseType ?? '').trim();
  if (Number.isNaN(id) || !name?.trim() || !type) {
    return res.status(400).json({ error: 'נתונים לא תקינים — יש למלא שם וסוג רישיון' });
  }
  if (!isValidLicenseType(type)) {
    return res.status(400).json({ error: 'סוג רישיון לא תקין' });
  }

  try {
    const updated = await query(
      `UPDATE driver SET fullname = $1, phone = $2, licensetype = $3
       WHERE driverid = $4`,
      [name.trim(), phone?.trim() || null, type, id],
    );
    if (updated.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }
    const result = await query<DriverRow>(
      `${DRIVER_SELECT} WHERE driverid = $1`,
      [id],
    );
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
