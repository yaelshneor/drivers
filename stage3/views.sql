-- view 1 
CREATE VIEW V_DriverTrips AS
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
    r.end_location
FROM trip t
JOIN driver d
    ON t.driver_id = d.driverid
JOIN bus b
    ON t.bus_id = b.busid
JOIN route r
    ON t.route_id = r.route_id;
    
--first sql on the first view
SELECT *
FROM V_DriverTrips
WHERE driverid = 1001;

--second sql on the first view
SELECT
    driver_name,
    route_name,
    trip_date
FROM V_DriverTrips
WHERE end_location = 'חיפה';

--view 2
CREATE VIEW V_RouteStops AS
SELECT
    r.route_id,
    r.route_name,
    s.stop_id,
    s.stop_name,
    rs.stop_order,
    rs.estimated_arrival_time,
    r.region_id
FROM route_stop rs
JOIN route r
    ON rs.route_id = r.route_id
JOIN stop s
    ON rs.stop_id = s.stop_id;

--first sql on the second view
SELECT
    stop_name,
    stop_order
FROM V_RouteStops
WHERE route_id = 244
ORDER BY stop_order;

--second sql on the second view
SELECT DISTINCT
    route_id,
    route_name
FROM V_RouteStops
WHERE stop_id = 10;