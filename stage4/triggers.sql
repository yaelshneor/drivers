---------------------------------------
--trigger 1: to audit trip updates --
---------------------------------------

-- trigger function
CREATE OR REPLACE FUNCTION trip_update_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_driver_name TEXT;
    v_old_route TEXT;
    v_new_route TEXT;
BEGIN
    SELECT fullname INTO v_driver_name FROM driver WHERE driverid = NEW.driver_id;

    SELECT route_name || ' (' || start_location || ' -> ' || end_location || ')'
    INTO v_old_route FROM route WHERE route_id = OLD.route_id;

    SELECT route_name || ' (' || start_location || ' -> ' || end_location || ')'
    INTO v_new_route FROM route WHERE route_id = NEW.route_id;

    RAISE NOTICE 'Trip updated: driver %, date %, departure %, plate %, route: % -> %',
        v_driver_name,
        NEW.trip_date,
        NEW.departure_time,
        NEW.plate_number,
        v_old_route,
        v_new_route;

    RETURN NEW;
END;
$$;

-- create trigger
CREATE TRIGGER trg_trip_update
AFTER UPDATE ON trip
FOR EACH ROW
EXECUTE FUNCTION trip_update_audit();

-- example: verify trg_trip_update (check Messages tab for NOTICE)
SELECT trip_id, route_id FROM trip WHERE trip_id = 1;

UPDATE trip
SET route_id = (
    SELECT route_id FROM route
    WHERE route_id <> (SELECT route_id FROM trip WHERE trip_id = 1)
    LIMIT 1
)
WHERE trip_id = 1;

SELECT trip_id, route_id FROM trip WHERE trip_id = 1;

-- trigger function
CREATE OR REPLACE FUNCTION validate_driver_before_trip()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_exists INT;
BEGIN

    SELECT COUNT(*)
    INTO v_exists
    FROM driver
    WHERE driverid = NEW.driver_id;

    IF v_exists = 0 THEN
        RAISE EXCEPTION 'Driver % does not exist', NEW.driver_id;
    END IF;

    RETURN NEW;
END;
$$;

-- create trigger
CREATE TRIGGER trg_validate_driver
BEFORE INSERT ON trip
FOR EACH ROW
EXECUTE FUNCTION validate_driver_before_trip();

-- example: verify trg_validate_driver — should ERROR (driver does not exist)
INSERT INTO trip (
    trip_id, driver_id, route_id, bus_id,
    trip_date, departure_time, available_seats, plate_number
)
VALUES (
    (SELECT COALESCE(MAX(trip_id), 0) + 1 FROM trip),
    999999,
    1,
    1001,
    CURRENT_DATE,
    0,
    50,
    (SELECT plate_number FROM vehicle LIMIT 1)
);

-- example: verify trg_validate_driver — should succeed
INSERT INTO trip (
    trip_id, driver_id, route_id, bus_id,
    trip_date, departure_time, available_seats, plate_number
)
VALUES (
    (SELECT COALESCE(MAX(trip_id), 0) + 1 FROM trip),
    1001,
    1,
    1001,
    CURRENT_DATE,
    0,
    50,
    (SELECT plate_number FROM vehicle LIMIT 1)
)
