---------------------------------------
-- MAIN PROGRAM 1: Driver Analysis & Route Update
---------------------------------------

BEGIN;

-- Driver analytics + route update
SELECT get_driver_monthly_trips(1131, 1, 2026);

SELECT *
FROM get_driver_top_region_activity(1131);

CALL update_route_statistics();

SELECT route_id, estimated_duration_minutes
FROM route;

COMMIT;

---------------------------------------
-- MAIN PROGRAM 2: Route Maintenance & Driver Assignment
---------------------------------------

BEGIN;

-- Driver assignment + system update
SELECT get_driver_monthly_trips(1131, 1, 2026);

SELECT *
FROM get_driver_top_region_activity(1131);

CALL create_random_trips(10);

SELECT trip_id, driver_id, route_id
FROM trip;

COMMIT;