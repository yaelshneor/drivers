export const UPDATE_DRIVER_SQL = `
  UPDATE driver
  SET fullname = $1, licensetype = $2, phone = $3
  WHERE driverid = $4
`;

export const DRIVER_TRIP_SUMMARY_SQL = `
  SELECT
    d.driverid,
    d.fullname,
    d.phone,
    d.licensetype,
    COUNT(t.trip_id) AS total_trips
  FROM driver d
  LEFT JOIN trip t ON d.driverid = t.driver_id
  GROUP BY d.driverid, d.fullname, d.phone, d.licensetype
  ORDER BY total_trips DESC, d.driverid
`;
