import { Router } from 'express';
import { query } from '../db/pool.js';

const VEHICLE_SELECT = `
  SELECT busid, licenseplate, capacity, manufacturer, model, year, vehicle_type
  FROM vehicle
`;

type VehicleRow = {
  busid: number;
  licenseplate: number;
  capacity: number;
  manufacturer: string;
  model: string;
  year: number;
  vehicle_type: string | null;
};

export function mapVehicleRow(row: VehicleRow) {
  return {
    id: String(row.busid),
    licensePlate: String(row.licenseplate),
    capacity: row.capacity,
    manufacturer: row.manufacturer,
    model: row.model,
    year: row.year,
    vehicleType: row.vehicle_type ?? '',
  };
}

export const vehiclesRouter = Router();

vehiclesRouter.get('/', async (_req, res) => {
  try {
    const result = await query<VehicleRow>(`${VEHICLE_SELECT} ORDER BY busid`);
    return res.json(result.rows.map(mapVehicleRow));
  } catch (err) {
    console.error('GET /api/vehicles', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});

vehiclesRouter.post('/', async (req, res) => {
  const {
    id,
    licensePlate,
    capacity,
    manufacturer,
    model,
    year,
    vehicleType,
  } = req.body ?? {};

  const busid = Number.parseInt(String(id), 10);
  const licenseplate = Number.parseInt(String(licensePlate), 10);
  const cap = Number.parseInt(String(capacity), 10);
  const yr = Number.parseInt(String(year), 10);

  if (
    Number.isNaN(busid) ||
    Number.isNaN(licenseplate) ||
    Number.isNaN(cap) ||
    cap < 1 ||
    cap > 200 ||
    Number.isNaN(yr) ||
    !manufacturer?.trim() ||
    !model?.trim() ||
    !vehicleType?.trim()
  ) {
    return res.status(400).json({ error: 'נתונים לא תקינים — יש למלא את כל השדות' });
  }

  try {
    const exists = await query('SELECT 1 FROM vehicle WHERE busid = $1 OR licenseplate = $2', [
      busid,
      licenseplate,
    ]);
    if (exists.rowCount) {
      return res.status(400).json({ error: 'מזהה או מספר רישוי כבר קיים' });
    }

    await query(
      `INSERT INTO vehicle (busid, licenseplate, capacity, manufacturer, model, year, vehicle_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        busid,
        licenseplate,
        cap,
        manufacturer.trim(),
        model.trim(),
        yr,
        vehicleType.trim(),
      ],
    );

    const result = await query<VehicleRow>(`${VEHICLE_SELECT} WHERE busid = $1`, [busid]);
    return res.status(201).json(mapVehicleRow(result.rows[0]));
  } catch (err) {
    console.error('POST /api/vehicles', err);
    return res.status(500).json({ error: 'שגיאת שרת' });
  }
});
