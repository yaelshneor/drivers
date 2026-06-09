---------------------------------------
--trigger 1: to audit trip updates --
---------------------------------------

-- trigger function
CREATE OR REPLACE FUNCTION trip_update_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    RAISE NOTICE 'Trip updated: ID %, Old Route %, New Route %',
        OLD.trip_id,
        OLD.route_id,
        NEW.route_id;

    RETURN NEW;
END;
$$;

-- create trigger
CREATE TRIGGER trg_trip_update
AFTER UPDATE ON trip
FOR EACH ROW
EXECUTE FUNCTION trip_update_audit();

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
