import { Router } from 'express';
import { query } from '../db/pool.js';
import { LICENSE_TYPES, isValidLicenseType } from '../constants/licenseTypes.js';
import { mapDriverRow } from '../db/mappers.js';
import { DRIVER_TRIP_SUMMARY_SQL, UPDATE_DRIVER_SQL } from '../queries/stage2Queries.js';

const DRIVER_SELECT = `
  SELECT driverid, fullname, phone, licensetype
  FROM driver
`;

const DRIVER_TRIP_SUMMARY_BY_ID_SQL = `
  SELECT
    d.driverid,
    d.fullname,
    d.phone,
    d.licensetype,
    COUNT(t.trip_id) AS total_trips
  FROM driver d
  LEFT JOIN trip t ON d.driverid = t.driver_id
  WHERE d.driverid = $1
  GROUP BY d.driverid, d.fullname, d.phone, d.licensetype
`;

type DriverRow = {
  driverid: number;
  fullname: string;
  phone: string | null;
  licensetype: string;
};

type DriverWithTripsRow = DriverRow & {
  total_trips: string;
};

function mapDriverWithTripsRow(row: DriverWithTripsRow) {
  return {
    ...mapDriverRow(row),
    totalTrips: Number(row.total_trips),
  };
}

export const driversRouter = Router();

driversRouter.get('/license-types', (_req, res) => {
  return res.json([...LICENSE_TYPES]);
});

driversRouter.get('/', async (_req, res) => {
  try {
    const result = await query<DriverWithTripsRow>(DRIVER_TRIP_SUMMARY_SQL);
    return res.json(result.rows.map(mapDriverWithTripsRow));
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
    return res.status(201).json({ ...mapDriverRow(result.rows[0]), totalTrips: 0 });
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
    const updated = await query(UPDATE_DRIVER_SQL, [
      name.trim(),
      type,
      phone?.trim() || null,
      id,
    ]);
    if (updated.rowCount === 0) {
      return res.status(404).json({ error: 'מזהה נהג לא נמצא' });
    }
    const result = await query<DriverWithTripsRow>(DRIVER_TRIP_SUMMARY_BY_ID_SQL, [id]);
    return res.json(mapDriverWithTripsRow(result.rows[0]));
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
