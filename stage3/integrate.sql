
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
-- ROUTE
-- STOP
-- TRIP
-- ROUTE_STOP

-- ==========================================
-- STEP 2 - Create integrated ROUTE table
-- ==========================================
-- A new ROUTE table was created containing
-- attributes from both databases.

CREATE TABLE ROUTE_NEW
(
route_id INT NOT NULL,
route_name INT NOT NULL,
start_location INT NOT NULL,
end_location INT NOT NULL,
estimated_duration_minutes INT NOT NULL,
total_distance_km INT NOT NULL,
created_date INT NOT NULL,
region_id INT NOT NULL,

```
PRIMARY KEY (route_id),

FOREIGN KEY (region_id)
    REFERENCES REGION(region_id)
```

);

-- ==========================================
-- STEP 3 - Copy data from old ROUTE table
-- ==========================================
-- Copy route data from database #1

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
1
FROM ROUTE_OLD;

-- ==========================================
-- STEP 4 - Copy data from second ROUTE table
-- ==========================================
-- Copy route data from database #2
-- Avoid duplicate route_id values

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
route_id,
route_name,
start_location,
end_location,
estimated_duration_minutes,
total_distance_km,
created_date,
region_id
FROM ROUTE
WHERE NOT EXISTS
(
SELECT 1
FROM ROUTE_NEW r
WHERE r.route_id = ROUTE.route_id
);

-- ==========================================
-- STEP 5 - Create integrated STOP table
-- ==========================================

CREATE TABLE STOP_NEW
(
stop_id INT NOT NULL,
stop_name INT NOT NULL,
address INT NOT NULL,
latitude INT NOT NULL,
longitude INT NOT NULL,
site_name INT NOT NULL,

```
PRIMARY KEY (stop_id),

FOREIGN KEY (site_name)
    REFERENCES SITE(site_name)
```

);

-- ==========================================
-- STEP 6 - Copy STOP data from database #1
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
0
FROM STOP_OLD;

-- ==========================================
-- STEP 7 - Copy STOP data from database #2
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
stop_id,
stop_name,
address,
latitude,
longitude,
site_name
FROM STOP
WHERE NOT EXISTS
(
SELECT 1
FROM STOP_NEW s
WHERE s.stop_id = STOP.stop_id
);

-- ==========================================
-- STEP 8 - Create integrated ROUTE_STOP table
-- ==========================================

CREATE TABLE ROUTE_STOP_NEW
(
stop_order INT NOT NULL,
estimated_arrival_time INT NOT NULL,
route_id INT NOT NULL,
stop_id INT NOT NULL,

```
PRIMARY KEY (route_id, stop_id),

FOREIGN KEY (route_id)
    REFERENCES ROUTE_NEW(route_id),

FOREIGN KEY (stop_id)
    REFERENCES STOP_NEW(stop_id)
```

);

-- ==========================================
-- STEP 9 - Copy ROUTESTOP data from DB #1
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
FROM ROUTESTOP_OLD;

-- ==========================================
-- STEP 10 - Copy ROUTE_STOP data from DB #2
-- ==========================================

INSERT INTO ROUTE_STOP_NEW
(
stop_order,
estimated_arrival_time,
route_id,
stop_id
)
SELECT
stop_order,
estimated_arrival_time,
route_id,
stop_id
FROM ROUTE_STOP
WHERE NOT EXISTS
(
SELECT 1
FROM ROUTE_STOP_NEW rs
WHERE rs.route_id = ROUTE_STOP.route_id
AND rs.stop_id = ROUTE_STOP.stop_id
);

-- ==========================================
-- STEP 11 - Update foreign keys
-- ==========================================

ALTER TABLE TRIP
DROP CONSTRAINT trip_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_route_id_fkey;

ALTER TABLE ROUTE_STOP_NEW
DROP CONSTRAINT route_stop_new_stop_id_fkey;

-- ==========================================
-- STEP 12 - Remove old tables
-- ==========================================

DROP TABLE ROUTE_OLD;
DROP TABLE STOP_OLD;
DROP TABLE ROUTESTOP_OLD;

-- ==========================================
-- STEP 13 - Rename integrated tables
-- ==========================================

ALTER TABLE ROUTE_NEW
RENAME TO ROUTE;

ALTER TABLE STOP_NEW
RENAME TO STOP;

ALTER TABLE ROUTE_STOP_NEW
RENAME TO ROUTE_STOP;

-- ==========================================
-- END OF INTEGRATION PROCESS
-- ==========================================
