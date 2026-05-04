---------------------------------------
--select queries --
---------------------------------------

/* screen-7.png */
-- שליפת כמות הנסיעות של כל נהג עבור מסך שבע סיכום נסיעות
--version 1
SELECT 
    d.DriverID,
    d.FullName,
    COUNT(t.TripID) AS TotalTrips
FROM DRIVER d
LEFT JOIN TRIP t ON d.DriverID = t.DriverID
GROUP BY d.DriverID, d.FullName;

--version 2
SELECT 
    d.DriverID,
    d.FullName,
    (SELECT COUNT(*) 
     FROM TRIP t 
     WHERE t.DriverID = d.DriverID) AS TotalTrips
FROM DRIVER d;

/* screen-5.png */
-- שליפת תאריכי הנסיעות של נהג 
--version 1
SELECT 
    t.TripID,
    t.TripDate,
    t.Status,
    r.RouteName,
    r.StartLocation,
    r.EndLocation,
    b.Manufacturer,
    b.Model
FROM TRIP t
JOIN ROUTE r ON t.RouteID = r.RouteID
JOIN BUS b ON t.BusID = b.BusID
WHERE t.DriverID = 1001
AND t.TripDate = DATE '2026-04-30'
ORDER BY t.TripDate;

--version 2
SELECT *
FROM TRIP t
WHERE t.DriverID = 1001
AND t.TripDate = DATE '2026-04-30'
AND t.RouteID IN (
    SELECT r.RouteID
    FROM ROUTE r
);

/* screen-9.png */
-- מציגה למנהל את כל הבקשות לביטול 
--version 1
SELECT
    t.TripID,
    t.TripDate,
    t.Status,
    r.RouteName,
    r.StartLocation,
    r.EndLocation,
    b.Manufacturer,
    b.Model
FROM TRIP t
JOIN ROUTE r ON t.RouteID = r.RouteID
JOIN BUS b ON t.BusID = b.BusID
WHERE t.Status = 'Pending Cancellation'
ORDER BY t.TripDate;

--version 2
SELECT 
    t.TripID,
    t.TripDate,
    (SELECT d.FullName 
     FROM DRIVER d 
     WHERE d.DriverID = t.DriverID) AS DriverName,
    (SELECT r.RouteName 
     FROM ROUTE r 
     WHERE r.RouteID = t.RouteID) AS RouteName,
    t.Status
FROM TRIP t
WHERE t.Status = 'Pending Cancellation';

/* screen-3.png */
--מסך נסיעות כללי כל הנסיעות העתידיות 
--version 1
SELECT
    t.TripID,
    t.TripDate,
    t.Status,
    r.RouteName,
    r.StartLocation,
    r.EndLocation,
    b.Manufacturer,
    b.Model
FROM TRIP t
JOIN ROUTE r ON t.RouteID = r.RouteID
JOIN BUS b ON t.BusID = b.BusID
WHERE t.Status = 'Active' or t.Status = 'Pending Cancellation'
ORDER BY t.TripDate;

--version 2
SELECT 
    t.TripID,
    t.TripDate,
    (SELECT d.FullName 
     FROM DRIVER d 
     WHERE d.DriverID = t.DriverID) AS DriverName,
    (SELECT r.RouteName 
     FROM ROUTE r 
     WHERE r.RouteID = t.RouteID) AS RouteName,
    t.Status
FROM TRIP t
WHERE t.Status = 'Active' or t.Status = 'Pending Cancellation';

/* screen-1.png */
-- מציגה פרטי נהג במסך ראשי
SELECT 
    DriverID,
    FullName,
    LicenseType
FROM DRIVER
WHERE DriverID = 1002;

-- היסטוריית נסיעות (לפני היום) 
SELECT
    t.TripID,
    t.TripDate,
    t.Status,
    d.FullName AS DriverName,
    r.RouteName,
    r.StartLocation,
    r.EndLocation,
    b.Manufacturer,
    b.Model
FROM TRIP t
JOIN DRIVER d ON t.DriverID = d.DriverID
JOIN ROUTE r ON t.RouteID = r.RouteID
JOIN BUS b ON t.BusID = b.BusID
WHERE (t.TripDate)::date < CURRENT_DATE
ORDER BY t.TripDate DESC;

/* screen-2.png */
-- רשימת נהגים 
SELECT *
FROM (
    SELECT DISTINCT ON (d.DriverID)
        d.FullName AS DriverName,
        d.DriverID,
        d.Phone,
        b.LicensePlate::TEXT AS LicenseNumber,
        CASE
            WHEN b.Capacity IS NULL THEN NULL
            WHEN b.Capacity <= 20 THEN 'מיניבוס'
            WHEN b.Capacity <= 50 THEN 'אוטובוס עירוני'
            ELSE 'אוטובוס תיירותי'
        END AS Bus
    FROM DRIVER d
    LEFT JOIN TRIP t ON t.DriverID = d.DriverID
    LEFT JOIN BUS b ON b.BusID = t.BusID
    ORDER BY d.DriverID, t.TripID DESC NULLS LAST
) drivers_list
ORDER BY DriverName;

/* screen-8.png */
-- לוח נסיעות לנהג (חודש מלא) 
SELECT
    t.TripID,
    (t.TripDate)::date AS TripDay,
    TO_CHAR(t.TripDate::timestamp, 'HH24:MI') AS TripTime,
    r.EndLocation AS Destination,
    r.RouteName,
    t.Status,
    t.TripDate
FROM TRIP t
JOIN ROUTE r ON r.RouteID = t.RouteID
WHERE t.DriverID = 1001
    AND t.TripDate IS NOT NULL
    AND EXTRACT(YEAR FROM t.TripDate::timestamp) = 2026
    AND EXTRACT(MONTH FROM t.TripDate::timestamp) = 1
    AND t.Status IS DISTINCT FROM 'Cancelled'
ORDER BY t.TripDate;



---------------------------------------
--update queries --
---------------------------------------

-- עדכון נהג לפי מזהה (לא משנים DriverID — מפתח ראשי וקישורים לנסיעות)
UPDATE driver
SET
    fullname = 'yafit',
    licensetype = 'B',
    phone = '050-1234567'
WHERE driverid = 1;

-- כל הנסיעות Pending Cancellation / pending cancelation → מבוטלות
UPDATE trip
SET status = 'Cancelled'
WHERE TRIM(status) ILIKE 'pending cancellation'
   OR TRIM(status) ILIKE 'pending cancelation';

-- כפול 2 למשך משוער: כל המסלולים שמופיעים בהכי הרבה נסיעות (כולל תיקו)
UPDATE route r
SET estimatedduration = r.estimatedduration * 2
WHERE r.routeid IN (
    SELECT pr.routeid
    FROM (
        SELECT t.routeid, COUNT(*)::bigint AS cnt
        FROM trip t
        GROUP BY t.routeid
    ) pr
    WHERE pr.cnt = (
        SELECT MAX(pr2.cnt)
        FROM (
            SELECT COUNT(*)::bigint AS cnt
            FROM trip t2
            GROUP BY t2.routeid
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
    WHERE t.driverid = d.driverid
);

-- מחיקת כל האוטובוסים שאין להם אף שורה ב-trip
DELETE FROM BUS
WHERE NOT EXISTS (
    SELECT 1
    FROM TRIP t
    WHERE t.BusID = BUS.BusID
);

-- מחיקת נסיעות על מסלולים שמכילים תחנה שמקושרת ליותר משני טיולים שונים (COUNT DISTINCT TripID > 2)
DELETE FROM TRIP
WHERE TripID IN (
    SELECT t.TripID
    FROM TRIP t
    JOIN ROUTESTOP rs ON rs.RouteID = t.RouteID
    WHERE rs.StopID IN (
        SELECT rs2.StopID
        FROM ROUTESTOP rs2
        JOIN TRIP t2 ON t2.RouteID = rs2.RouteID
        GROUP BY rs2.StopID
        HAVING COUNT(DISTINCT t2.TripID) > 2
    )
);