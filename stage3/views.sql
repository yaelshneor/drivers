-- ========================================================
-- מבטים (Views) לשלב ג'
-- ========================================================

-- מבט 1: המערכת המקורית שלנו (נהגים, אוטובוסים ונסיעות)
-- מיזוג trip, driver, bus, route + עמודות מחושבות (COUNT, CASE, אחוז תפוסה)
CREATE OR REPLACE VIEW V_DriverTrips AS
SELECT
    t.trip_id,
    t.trip_date,
    t.departure_time,
    d.driverid,
    d.fullname AS driver_name,
    b.busid,
    b.licenseplate,
    r.route_name,
    r.start_location,
    r.end_location,
    (SELECT COUNT(*)
     FROM trip t2
     WHERE t2.driver_id = d.driverid) AS driver_total_trips,
    (SELECT COUNT(*)
     FROM trip t3
     WHERE t3.route_id = r.route_id) AS route_total_trips,
    CASE
        WHEN (SELECT COUNT(*) FROM trip t2 WHERE t2.driver_id = d.driverid) >= 10
            THEN 'פעילות גבוהה'
        WHEN (SELECT COUNT(*) FROM trip t2 WHERE t2.driver_id = d.driverid) >= 3
            THEN 'פעילות בינונית'
        ELSE 'פעילות נמוכה'
    END AS driver_activity,
    CASE
        WHEN t.available_seats IS NULL OR b.capacity IS NULL THEN NULL
        ELSE ROUND((b.capacity - t.available_seats) * 100.0 / NULLIF(b.capacity, 0), 1)
    END AS occupancy_pct
FROM trip t
JOIN driver d ON t.driver_id = d.driverid
JOIN bus b ON t.bus_id = b.busid
JOIN route r ON t.route_id = r.route_id;

-- שאילתה 1 על מבט 1: נסיעות של נהג 1001 עם סטטיסטיקות מחושבות
SELECT
    trip_id,
    trip_date,
    driver_name,
    route_name,
    driver_total_trips,
    route_total_trips,
    driver_activity,
    occupancy_pct
FROM V_DriverTrips
WHERE driverid = 1001;

-- שאילתה 2 על מבט 1: נסיעות ליעד חיפה + פעילות נהג ותפוסה
SELECT
    driver_name,
    route_name,
    trip_date,
    end_location,
    route_total_trips,
    driver_activity,
    occupancy_pct
FROM V_DriverTrips
WHERE end_location = 'חיפה';


-- מבט 2: הדטהבייס הנוסף שהתקבל (מסלולים, תחנות ואזורים)
-- מיזוג route_stop, route, stop + עמודות מחושבות (COUNT, CASE, אחוז מיקום בתחנה)
CREATE OR REPLACE VIEW V_RouteStops AS
SELECT
    r.route_id,
    r.route_name,
    s.stop_id,
    s.stop_name,
    rs.stop_order,
    rs.estimated_arrival_time,
    r.region_id,
    (SELECT COUNT(*)
     FROM route_stop rs2
     WHERE rs2.route_id = r.route_id) AS stops_on_route,
    (SELECT COUNT(*)
     FROM trip t
     WHERE t.route_id = r.route_id) AS trips_on_route,
    (SELECT COUNT(DISTINCT s2.site_name)
     FROM route_stop rs3
     JOIN stop s2 ON rs3.stop_id = s2.stop_id
     WHERE rs3.route_id = r.route_id) AS sites_on_route,
    CASE
        WHEN rs.stop_order = (
            SELECT MIN(rs4.stop_order)
            FROM route_stop rs4
            WHERE rs4.route_id = r.route_id
        ) THEN 'ראשונה'
        WHEN rs.stop_order = (
            SELECT MAX(rs5.stop_order)
            FROM route_stop rs5
            WHERE rs5.route_id = r.route_id
        ) THEN 'אחרונה'
        ELSE 'ביניים'
    END AS stop_position,
    ROUND(
        rs.stop_order * 100.0
        / NULLIF((
            SELECT COUNT(*)
            FROM route_stop rs6
            WHERE rs6.route_id = r.route_id
        ), 0),
        1
    ) AS stop_order_pct
FROM route_stop rs
JOIN route r ON rs.route_id = r.route_id
JOIN stop s ON rs.stop_id = s.stop_id;

-- שאילתה 1 על מבט 2: תחנות במסלול עם הכי הרבה עצירות
SELECT
    route_id,
    stop_name,
    stop_order,
    stop_position,
    stop_order_pct,
    stops_on_route,
    trips_on_route,
    sites_on_route
FROM V_RouteStops
WHERE route_id = (
    SELECT route_id
    FROM V_RouteStops
    GROUP BY route_id
    ORDER BY MAX(stops_on_route) DESC
    LIMIT 1
)
ORDER BY stop_order;

-- שאילתה 2 על מבט 2: מסלולים דרך תחנה 10 עם נסיעות מעל הממוצע
SELECT
    route_id,
    route_name,
    region_id,
    stops_on_route,
    trips_on_route,
    sites_on_route,
    stop_order,
    stop_position,
    stop_order_pct
FROM V_RouteStops
WHERE stop_id = 10
  AND trips_on_route >= (
      SELECT ROUND(AVG(trips_on_route), 0)
      FROM V_RouteStops
      WHERE stop_id = 10
  )
ORDER BY trips_on_route DESC, stops_on_route DESC, route_id;
