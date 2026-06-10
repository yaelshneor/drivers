---------------------------------------
--select queries --
---------------------------------------

/* screen-7.png */
-- שליפת כמות הנסיעות של כל נהג עבור מסך שבע סיכום נסיעות
--version 1 !!!
SELECT 
    d.driverid,
    d.fullname,
    COUNT(t.trip_id) AS TotalTrips
FROM driver d
LEFT JOIN trip t ON d.driverid = t.driver_id
GROUP BY d.driverid, d.fullname;

--version 2
SELECT 
    d.driverid,
    d.fullname,
    (SELECT COUNT(*) 
     FROM trip t 
     WHERE t.driver_id = d.driverid) AS TotalTrips
FROM driver d;

/* screen-5.png */
-- שליפת תאריכי הנסיעות של נהג 
--version 1
SELECT 
    t.trip_id,
    t.trip_date,
    r.route_name,
    r.start_location,
    r.end_location,
    b.manufacturer,
    b.model
FROM trip t
JOIN route r ON t.route_id = r.route_id
JOIN bus b ON t.bus_id = b.busid
WHERE t.driver_id = 1001
AND t.trip_date = DATE '2026-04-30'
ORDER BY t.trip_date;

--version 2
SELECT *
FROM trip t
WHERE t.driver_id = 1001
AND t.trip_date = DATE '2026-04-30'
AND t.route_id IN (
    SELECT r.route_id
    FROM route r
);

/* screen-9.png */
-- מציגה למנהל את כל הבקשות לביטול !!!
--version 1
SELECT
    t.trip_id,
    t.trip_date,
    r.route_name,
    r.start_location,
    r.end_location,
    b.manufacturer,
    b.model
FROM trip t
JOIN route r ON t.route_id = r.route_id
JOIN bus b ON t.bus_id = b.busid
ORDER BY t.trip_date;

--version 2
SELECT 
    t.trip_id,
    t.trip_date,
    (SELECT d.fullname 
     FROM driver d 
     WHERE d.driverid = t.driver_id) AS DriverName,
    (SELECT r.route_name 
     FROM route r 
     WHERE r.route_id = t.route_id) AS RouteName
FROM trip t;

/* screen-3.png */
--מסך נסיעות כללי כל הנסיעות העתידיות !!!
--version 1
SELECT
    t.trip_id,
    t.trip_date,
    r.route_name,
    r.start_location,
    r.end_location,
    b.manufacturer,
    b.model
FROM trip t
JOIN route r ON t.route_id = r.route_id
JOIN bus b ON t.bus_id = b.busid
WHERE t.trip_date >= CURRENT_DATE
ORDER BY t.trip_date;

--version 2
SELECT 
    t.trip_id,
    t.trip_date,
    (SELECT d.fullname 
     FROM driver d 
     WHERE d.driverid = t.driver_id) AS DriverName,
    (SELECT r.route_name 
     FROM route r 
     WHERE r.route_id = t.route_id) AS RouteName
FROM trip t
WHERE t.trip_date >= CURRENT_DATE;

/* screen-1.png */
-- מציגה פרטי נהג במסך ראשי !!!
SELECT 
    driverid,
    fullname,
    licensetype
FROM driver
WHERE driverid = 1002;

-- היסטוריית נסיעות (לפני היום) !!!
SELECT
    t.trip_id,
    t.trip_date,
    d.fullname AS DriverName,
    r.route_name,
    r.start_location,
    r.end_location,
    b.manufacturer,
    b.model
FROM trip t
JOIN driver d ON t.driver_id = d.driverid
JOIN route r ON t.route_id = r.route_id
JOIN bus b ON t.bus_id = b.busid
WHERE t.trip_date < CURRENT_DATE
ORDER BY t.trip_date DESC;

/* screen-2.png */
-- רשימת נהגים 
SELECT *
FROM (
    SELECT DISTINCT ON (d.driverid)
        d.fullname AS DriverName,
        d.driverid,
        d.phone,
        b.licenseplate::TEXT AS LicenseNumber,
        CASE
            WHEN b.capacity IS NULL THEN NULL
            WHEN b.capacity <= 20 THEN 'מיניבוס'
            WHEN b.capacity <= 50 THEN 'אוטובוס עירוני'
            ELSE 'אוטובוס תיירותי'
        END AS Bus
    FROM driver d
    LEFT JOIN trip t ON t.driver_id = d.driverid
    LEFT JOIN bus b ON b.busid = t.bus_id
    ORDER BY d.driverid, t.trip_id DESC NULLS LAST
) drivers_list
ORDER BY DriverName;

/* screen-8.png */
-- לוח נסיעות לנהג (חודש מלא) !!!
SELECT
    t.trip_id,
    t.trip_date AS TripDay,
    TO_CHAR(TO_TIMESTAMP(LPAD(t.departure_time::text, 4, '0'), 'HH24MI'), 'HH24:MI') AS TripTime,
    r.end_location AS Destination,
    r.route_name,
    t.trip_date
FROM trip t
JOIN route r ON r.route_id = t.route_id
WHERE t.driver_id = 1131
    AND t.trip_date IS NOT NULL
    AND EXTRACT(YEAR FROM t.trip_date) = 2026
    AND EXTRACT(MONTH FROM t.trip_date) = 1
ORDER BY t.trip_date, t.departure_time;



---------------------------------------
--update queries --
---------------------------------------

-- עדכון נהג לפי מזהה (לא משנים driverid — מפתח ראשי וקישורים לנסיעות)
UPDATE driver
SET
    fullname = 'yafit',
    licensetype = 'B',
    phone = '050-1234567'
WHERE driverid = 1;

-- כפול 2 למשך משוער: כל המסלולים שמופיעים בהכי הרבה נסיעות (כולל תיקו)
UPDATE route r
SET estimated_duration_minutes = r.estimated_duration_minutes * 2
WHERE r.route_id IN (
    SELECT pr.route_id
    FROM (
        SELECT t.route_id, COUNT(*)::bigint AS cnt
        FROM trip t
        GROUP BY t.route_id
    ) pr
    WHERE pr.cnt = (
        SELECT MAX(pr2.cnt)
        FROM (
            SELECT COUNT(*)::bigint AS cnt
            FROM trip t2
            GROUP BY t2.route_id
        ) pr2
    )
);


---------------------------------------
--delete queries --
---------------------------------------

-- מחיקת כל הנהגים שאין להם אף שורה ב-trip
DELETE FROM driver d
WHERE NOT EXISTS (
    SELECT 1
    FROM trip t
    WHERE t.driver_id = d.driverid
);

-- מחיקת כל האוטובוסים שאין להם אף שורה ב-trip
DELETE FROM bus
WHERE NOT EXISTS (
    SELECT 1
    FROM trip t
    WHERE t.bus_id = bus.busid
);

-- מחיקת נסיעות על מסלולים שמכילים תחנה שמקושרת ליותר משני טיולים שונים (COUNT DISTINCT trip_id > 2)
DELETE FROM trip
WHERE trip_id IN (
    SELECT t.trip_id
    FROM trip t
    JOIN route_stop rs ON rs.route_id = t.route_id
    WHERE rs.stop_id IN (
        SELECT rs2.stop_id
        FROM route_stop rs2
        JOIN trip t2 ON t2.route_id = rs2.route_id
        GROUP BY rs2.stop_id
        HAVING COUNT(DISTINCT t2.trip_id) > 2
    )
);

DELETE FROM driver d
WHERE NOT EXISTS (
    SELECT 1
    FROM trip t
    WHERE t.driver_id = d.driverid
);
