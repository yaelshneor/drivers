---------------------------------------
--procedure 1: to assign a random driver to trips --
---------------------------------------
CREATE OR REPLACE PROCEDURE create_random_trips(p_count INT)
LANGUAGE plpgsql
AS $$
DECLARE
    i INT := 0;
    v_trip_id INT;
    v_driver_id INT;
    v_route_id INT;
    v_bus_id INT;
    v_plate_number VARCHAR;
BEGIN
    WHILE i < p_count LOOP

        -- נהג אקראי
        SELECT driverid
        INTO v_driver_id
        FROM driver
        ORDER BY RANDOM()
        LIMIT 1;

        -- מסלול אקראי
        SELECT route_id
        INTO v_route_id
        FROM route
        ORDER BY RANDOM()
        LIMIT 1;

        -- אוטובוס אקראי
        SELECT busid, licenseplate
        INTO v_bus_id, v_plate_number
        FROM vehicle
        ORDER BY RANDOM()
        LIMIT 1;

        -- יצירת trip_id חדש
        SELECT COALESCE(MAX(trip_id), 0) + 1
        INTO v_trip_id
        FROM trip;

        -- הכנסת נסיעה חדשה
        INSERT INTO trip (
            trip_id,
            trip_date,
            departure_time,
            available_seats,
            route_id,
            plate_number,
            driver_id,
            bus_id
        )
        VALUES (
            v_trip_id,
            CURRENT_DATE + i,
            FLOOR(RANDOM() * 2400),
            FLOOR(RANDOM() * 50) + 10,
            v_route_id,
            v_plate_number,
            v_driver_id,
            v_bus_id
        );

        i := i + 1;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
END;

--example of using the procedure
CALL create_random_trips(10);

---------------------------------------
--procedure 2: to update the route statistics --
---------------------------------------

DROP PROCEDURE IF EXISTS update_route_statistics(refcursor, int, int);

CREATE OR REPLACE PROCEDURE update_route_statistics(
    INOUT updated_routes REFCURSOR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    route_cur CURSOR FOR
        SELECT route_id, estimated_duration_minutes
        FROM route;
    rec_route RECORD;
    v_trip_count INT;
BEGIN
    OPEN route_cur;
    LOOP
        FETCH route_cur INTO rec_route;
        EXIT WHEN NOT FOUND;
        BEGIN
            SELECT COUNT(*)::INT
            INTO v_trip_count
            FROM trip
            WHERE route_id = rec_route.route_id;
            IF v_trip_count = 0 THEN
                UPDATE route
                SET estimated_duration_minutes = GREATEST(1, estimated_duration_minutes - 1)
                WHERE route_id = rec_route.route_id;
            ELSIF v_trip_count BETWEEN 1 AND 5 THEN
                UPDATE route
                SET estimated_duration_minutes = estimated_duration_minutes + 2
                WHERE route_id = rec_route.route_id;
            ELSE
                UPDATE route
                SET estimated_duration_minutes = estimated_duration_minutes + 4
                WHERE route_id = rec_route.route_id;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Route % failed: %', rec_route.route_id, SQLERRM;
        END;
    END LOOP;
    CLOSE route_cur;
    OPEN updated_routes FOR
        SELECT route_id, estimated_duration_minutes
        FROM route
        ORDER BY route_id;
EXCEPTION
    WHEN OTHERS THEN
        BEGIN
            CLOSE route_cur;
        EXCEPTION
            WHEN invalid_cursor_name THEN
                NULL;
        END;
        RAISE;
END;
$$;

-- before/after check
SELECT route_id, estimated_duration_minutes
FROM route
ORDER BY route_id
LIMIT 20;

--example using ref cursor
DO $$
DECLARE
    cur REFCURSOR;
    rec RECORD;
BEGIN
    CALL update_route_statistics(cur);
    LOOP
        FETCH cur INTO rec;
        EXIT WHEN NOT FOUND;
        RAISE NOTICE 'route % -> % minutes', rec.route_id, rec.estimated_duration_minutes;
    END LOOP;
    CLOSE cur;
END $$;