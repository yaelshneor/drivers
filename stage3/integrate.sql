
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
    created_date INT NOT NULL,
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
    0,
    0,
    (SELECT MIN(region_id) FROM REGION)
FROM ROUTE_OLD
UNION ALL
SELECT
    r.route_id,
    r.route_name,
    r.start_location,
    r.end_location,
    r.estimated_duration_minutes,
    r.total_distance_km,
    r.created_date,
    r.region_id
FROM ROUTE r
WHERE NOT EXISTS
(
    SELECT 1
    FROM ROUTE_OLD o
    WHERE o.RouteID = r.route_id
);

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
    s.stop_id,
    s.stop_name,
    s.address,
    s.latitude,
    s.longitude,
    s.site_name
FROM STOP s
WHERE NOT EXISTS
(
    SELECT 1
    FROM STOP_OLD o
    WHERE o.StopID = s.stop_id
);

-- ==========================================
-- STEP 6 - Create integrated ROUTE_STOP table
-- ==========================================

CREATE TABLE ROUTE_STOP_NEW
(
    stop_order INT NOT NULL,
    estimated_arrival_time INT NOT NULL,
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
    0,
    RouteID,
    StopID
FROM ROUTESTOP_OLD
UNION ALL
SELECT
    rs.stop_order,
    rs.estimated_arrival_time,
    rs.route_id,
    rs.stop_id
FROM ROUTE_STOP rs
WHERE NOT EXISTS
(
    SELECT 1
    FROM ROUTESTOP_OLD o
    WHERE o.RouteID = rs.route_id
      AND o.StopID = rs.stop_id
);

-- ==========================================
-- STEP 8 - Update foreign keys
-- ==========================================

ALTER TABLE TRIP
DROP CONSTRAINT trip_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_stop_id_fkey;

-- ==========================================
-- STEP 9 - Remove old tables
-- ==========================================

DROP TABLE ROUTE_OLD;
DROP TABLE STOP_OLD;
DROP TABLE ROUTESTOP_OLD;

-- ==========================================
-- STEP 10 - Rename integrated tables
-- ==========================================

ALTER TABLE ROUTE_NEW RENAME TO ROUTE;
ALTER TABLE STOP_NEW RENAME TO STOP;
ALTER TABLE ROUTE_STOP_NEW RENAME TO ROUTE_STOP;

-- ==========================================
-- END OF INTEGRATION PROCESS
-- ==========================================
