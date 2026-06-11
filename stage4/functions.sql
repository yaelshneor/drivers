---------------------------------------
--function 1: to get the number of trips for a driver in a specific month and year --
---------------------------------------

CREATE OR REPLACE FUNCTION get_driver_monthly_trips(
    p_driver_id INT,
    p_month INT,
    p_year INT
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    trip_count INT;
    driver_exists INT;
BEGIN

    -- בדיקה אם הנהג קיים
    SELECT COUNT(*)
    INTO driver_exists
    FROM driver
    WHERE driverid = p_driver_id;

    IF driver_exists = 0 THEN
        RAISE EXCEPTION 'Driver ID % does not exist', p_driver_id;
    END IF;

    -- ספירת נסיעות של הנהג בחודש ובשנה
    SELECT COUNT(*)
    INTO trip_count
    FROM trip
    WHERE driver_id = p_driver_id
        AND EXTRACT(MONTH FROM trip_date) = p_month
        AND EXTRACT(YEAR FROM trip_date) = p_year;

    RETURN trip_count;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occurred: %', SQLERRM;
        RETURN -1;
END;
$$;

--example of using the function
SELECT get_driver_monthly_trips(1131, 1, 2026);

---------------------------------------
--function 2: to get the top region activity for a driver
---------------------------------------

CREATE OR REPLACE FUNCTION get_driver_top_region_activity(p_driver_id INT)
RETURNS TABLE (
    driver_name TEXT,
    top_region INT,
    trip_count INT,
    route_count INT,
    status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_top_region INT;
    v_trip_count INT;
    v_route_count INT;
BEGIN
    SELECT fullname INTO driver_name FROM driver WHERE driverid = p_driver_id;
    IF driver_name IS NULL THEN
        RAISE EXCEPTION 'Driver not found';
    END IF;

    SELECT r.region_id INTO v_top_region
    FROM trip t
    JOIN route r ON t.route_id = r.route_id
    WHERE t.driver_id = p_driver_id
    GROUP BY r.region_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    IF v_top_region IS NULL THEN
        top_region := NULL;
        trip_count := 0;
        route_count := 0;
        status := 'אין פעילות באזור';
        RETURN NEXT;
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_trip_count
    FROM trip t
    JOIN route r ON t.route_id = r.route_id
    WHERE t.driver_id = p_driver_id AND r.region_id = v_top_region;

    SELECT COUNT(DISTINCT t.route_id) INTO v_route_count
    FROM trip t
    JOIN route r ON t.route_id = r.route_id
    WHERE t.driver_id = p_driver_id AND r.region_id = v_top_region;

    top_region := v_top_region;
    trip_count := v_trip_count;
    route_count := v_route_count;

    IF v_trip_count = 0 THEN
        status := 'אין פעילות באזור';
    ELSIF v_trip_count < 3 THEN
        status := 'פעילות נמוכה';
    ELSIF v_trip_count BETWEEN 3 AND 10 THEN
        status := 'פעילות בינונית';
    ELSE
        status := 'פעילות גבוהה';
    END IF;

    RETURN NEXT;
END;
$$;

--example of using the function
SELECT * FROM get_driver_top_region_activity(1001);



