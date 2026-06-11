export const STAGE2_QUERY_META = {
  updateDriver: {
    id: 'stage2-update-driver',
    file: 'stage2/scripts/Queries.sql',
    section: 'update queries',
    lines: '169-175',
    screen: null,
    type: 'UPDATE' as const,
    description: 'עדכון נהג לפי מזהה',
  },
  driverTripSummary: {
    id: 'stage2-screen7-v1',
    file: 'stage2/scripts/Queries.sql',
    section: 'screen-7.png',
    lines: '8-14',
    screen: 'screen-7',
    type: 'SELECT' as const,
    description: 'סיכום נסיעות לכל נהג',
  },
};

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
