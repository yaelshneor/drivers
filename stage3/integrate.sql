
-- ==========================================
-- STEP 1 - Rename duplicated tables
-- ==========================================
-- After restoring both databases into one DB,
-- duplicate tables were renamed to avoid conflicts.

ALTER TABLE ROUTE RENAME TO ROUTE_OLD;
ALTER TABLE STOP RENAME TO STOP_OLD;
ALTER TABLE TRIP RENAME TO TRIP_OLD;
ALTER TABLE ROUTESTOP RENAME TO ROUTESTOP_OLD;

-- Tables from second database remained:
-- ROUTE, STOP, TRIP, ROUTE_STOP

-- ==========================================
-- STEP 2 - Create integrated ROUTE table
-- ==========================================

CREATE TABLE ROUTE_NEW
(
    route_id INT NOT NULL,
    route_name VARCHAR(50) NOT NULL,
    start_location VARCHAR(50) NOT NULL,
    end_location VARCHAR(50) NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    total_distance_km INT NOT NULL,
    created_date DATE NOT NULL,
    region_id INT NOT NULL,
    PRIMARY KEY (route_id),
    FOREIGN KEY (region_id) REFERENCES REGION(region_id)
);

-- ==========================================
-- STEP 3 - Merge ROUTE data (both sources)
-- ==========================================

INSERT INTO ROUTE_NEW
(
    route_id,
    route_name,
    start_location,
    end_location,
    estimated_duration_minutes,
    total_distance_km,
    created_date,
    region_id
)
SELECT
    RouteID,
    RouteName,
    StartLocation,
    EndLocation,
    EstimatedDuration,
    (100 + FLOOR(RANDOM() * 200)::INT),
    (DATE '2025-10-24' + FLOOR(RANDOM() * 8)::INT)::DATE,
    ROW_NUMBER() OVER (ORDER BY RouteID)
FROM ROUTE_OLD
UNION ALL
SELECT
    route_id,
    route_name,
    start_location,
    end_location,
    estimated_duration_minutes,
    total_distance_km,
    created_date,
    region_id
FROM ROUTE;

-- ==========================================
-- STEP 4 - Create integrated STOP table
-- ==========================================

CREATE TABLE STOP_NEW
(
    stop_id INT NOT NULL,
    stop_name VARCHAR(100) NOT NULL,
    address VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    site_name INT NOT NULL,
    PRIMARY KEY (stop_id),
    FOREIGN KEY (site_name) REFERENCES SITE(site_name)
);

-- ==========================================
-- STEP 5 - Merge STOP data (both sources)
-- ==========================================

INSERT INTO STOP_NEW
(
    stop_id,
    stop_name,
    address,
    latitude,
    longitude,
    site_name
)
SELECT
    StopID,
    StopName,
    Address,
    Latitude,
    Longitude,
    (SELECT MIN(site_name) FROM SITE)
FROM STOP_OLD
UNION ALL
SELECT
    stop_id,
    stop_name,
    address,
    latitude,
    longitude,
    site_name
FROM STOP;

-- ==========================================
-- STEP 6 - Create integrated ROUTE_STOP table
-- ==========================================

CREATE TABLE ROUTE_STOP_NEW
(
    stop_order INT NOT NULL,
    estimated_arrival_time TIME NOT NULL,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    PRIMARY KEY (route_id, stop_id),
    FOREIGN KEY (route_id) REFERENCES ROUTE_NEW(route_id),
    FOREIGN KEY (stop_id) REFERENCES STOP_NEW(stop_id)
);

-- ==========================================
-- STEP 7 - Merge ROUTE_STOP data (both sources)
-- ==========================================

INSERT INTO ROUTE_STOP_NEW
(
    stop_order,
    estimated_arrival_time,
    route_id,
    stop_id
)
SELECT
    StopOrder,
    (make_time(6 + FLOOR(RANDOM() * 15)::INT, FLOOR(RANDOM() * 60)::INT, 0)),
    RouteID,
    StopID
FROM ROUTESTOP_OLD
UNION ALL
SELECT
    stop_order,
    estimated_arrival_time,
    route_id,
    stop_id
FROM ROUTE_STOP
WHERE NOT EXISTS
(
    SELECT 1
    FROM ROUTESTOP_OLD o
    WHERE o.RouteID = ROUTE_STOP.route_id
      AND o.StopID = ROUTE_STOP.stop_id
);

-- ==========================================
-- STEP 8 - Create integrated TRIP table
-- ==========================================
CREATE TABLE TRIP_NEW
(
    trip_id INT PRIMARY KEY,
    driver_id INT,
    bus_id INT,
    departure_time TIME,
    available_seats INT,
    plate_number INT,
    route_id INT,
    trip_date DATE
);

-- ==========================================
-- STEP 9 - Merge TRIP data (both sources)
-- ==========================================

INSERT INTO TRIP_NEW
(
    trip_id,
    driver_id,
    bus_id,
    departure_time,
    available_seats,
    plate_number,
    route_id,
    trip_date
)
SELECT
    TripID,
    DriverID,
    BusID,
    (make_time(6 + FLOOR(RANDOM() * 15)::INT, FLOOR(RANDOM() * 60)::INT, 0)),
    (10 + FLOOR(RANDOM() * 41)::INT),
    (SELECT plate_number FROM vehicle ORDER BY RANDOM() LIMIT 1),
    RouteID,
    TripDate::DATE
FROM TRIP_OLD
UNION ALL
SELECT
    trip_id,
    (SELECT driverid FROM driver ORDER BY RANDOM() LIMIT 1),
    (SELECT busid FROM bus ORDER BY RANDOM() LIMIT 1),
    departure_time,
    available_seats,
    plate_number,
    route_id,
    trip_date
FROM TRIP;

-- ==========================================
-- STEP 10 - Update foreign keys
-- ==========================================

ALTER TABLE TRIP
DROP CONSTRAINT trip_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_stop_id_fkey;

ALTER TABLE TRIP
ADD CONSTRAINT trip_route_id_fkey
FOREIGN KEY (route_id) REFERENCES ROUTE(route_id);

-- ==========================================
-- STEP 11 - Remove old tables
-- ==========================================

DROP TABLE ROUTE_OLD;
DROP TABLE STOP_OLD;
DROP TABLE ROUTESTOP_OLD;
DROP TABLE TRIP_OLD;

-- ==========================================
-- STEP 12 - Rename integrated tables
-- ==========================================

ALTER TABLE ROUTE_NEW RENAME TO ROUTE;
ALTER TABLE STOP_NEW RENAME TO STOP;
ALTER TABLE ROUTE_STOP_NEW RENAME TO ROUTE_STOP;
ALTER TABLE TRIP_NEW RENAME TO TRIP;

-- ==========================================
-- END OF INTEGRATION PROCESS
-- ==========================================
