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