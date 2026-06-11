---------------------------------------
-- תוכנית ראשית 1: ניתוח נהג ועדכון מסלולים
-- 1. get_driver_monthly_trips
-- 2. update_route_statistics
---------------------------------------

DO $$
DECLARE
    v_driver_id INT := 1131;
    v_driver_name TEXT;
    v_monthly_trips INT;
    rec RECORD;
    cur REFCURSOR;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'תוכנית ראשית 1 — ניתוח נהג ועדכון מסלולים';
    RAISE NOTICE '==================================================';

    SELECT fullname INTO v_driver_name FROM driver WHERE driverid = v_driver_id;
    IF v_driver_name IS NULL THEN
        RAISE NOTICE 'נהג % לא נמצא בבסיס הנתונים', v_driver_id;
        RETURN;
    END IF;
    RAISE NOTICE 'בודקים נהג: % (ID: %)', v_driver_name, v_driver_id;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'שלב 1: get_driver_monthly_trips — נסיעות בינואר 2026';
    v_monthly_trips := get_driver_monthly_trips(v_driver_id, 1, 2026);
    RAISE NOTICE 'מספר נסיעות: %', v_monthly_trips;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'שלב 2: update_route_statistics — לפני העדכון (10 מסלולים ראשונים)';
    FOR rec IN
        SELECT route_id, estimated_duration_minutes
        FROM route
        ORDER BY route_id
        LIMIT 10
    LOOP
        RAISE NOTICE '  route % -> % minutes', rec.route_id, rec.estimated_duration_minutes;
    END LOOP;

    CALL update_route_statistics(cur);

    RAISE NOTICE 'שלב 3: update_route_statistics — אחרי העדכון';
    FOR rec IN
        SELECT route_id, estimated_duration_minutes
        FROM route
        ORDER BY route_id
        LIMIT 10
    LOOP
        RAISE NOTICE '  route % -> % minutes', rec.route_id, rec.estimated_duration_minutes;
    END LOOP;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'תוכנית ראשית 1 הסתיימה בהצלחה';
    RAISE NOTICE '==================================================';
END;
$$;

---------------------------------------
-- תוכנית ראשית 2: תחזוקת מסלולים ושיבוץ נסיעות
-- 1. get_driver_top_region_activity
-- 2. create_random_trips (טריגר trg_validate_driver)
---------------------------------------

DO $$
DECLARE
    v_driver_id INT := 1131;
    v_driver_name TEXT;
    v_top_region TEXT;
    v_region_trips INT;
    v_region_routes INT;
    v_activity_status TEXT;
    v_trip_count_before INT;
    v_trip_count_after INT;
    rec RECORD;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'תוכנית ראשית 2 — תחזוקת מסלולים ושיבוץ נסיעות';
    RAISE NOTICE '==================================================';

    SELECT fullname INTO v_driver_name FROM driver WHERE driverid = v_driver_id;
    IF v_driver_name IS NULL THEN
        RAISE NOTICE 'נהג % לא נמצא בבסיס הנתונים', v_driver_id;
        RETURN;
    END IF;
    RAISE NOTICE 'בודקים נהג: % (ID: %)', v_driver_name, v_driver_id;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'שלב 1: get_driver_top_region_activity — לפני יצירת נסיעות';
    SELECT driver_name, top_region_name, trip_count, route_count, status
    INTO v_driver_name, v_top_region, v_region_trips, v_region_routes, v_activity_status
    FROM get_driver_top_region_activity(v_driver_id);
    RAISE NOTICE 'אזור מוביל: %', COALESCE(v_top_region, 'אין');
    RAISE NOTICE 'נסיעות באזור: %', v_region_trips;
    RAISE NOTICE 'סטטוס פעילות: %', v_activity_status;

    SELECT COUNT(*) INTO v_trip_count_before FROM trip;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'שלב 2: create_random_trips(10) — טריגר trg_validate_driver';
    RAISE NOTICE 'מספר נסיעות לפני: %', v_trip_count_before;

    CALL create_random_trips(10);

    SELECT COUNT(*) INTO v_trip_count_after FROM trip;
    RAISE NOTICE 'מספר נסיעות אחרי: % (נוספו %)', v_trip_count_after, v_trip_count_after - v_trip_count_before;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'שלב 3: 10 הנסיעות האחרונות שנוצרו';
    FOR rec IN
        SELECT trip_id, driver_id, route_id
        FROM trip
        ORDER BY trip_id DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '  trip % | driver % | route %', rec.trip_id, rec.driver_id, rec.route_id;
    END LOOP;

    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'בדיקת טריגר: INSERT עם נהג לא קיים (אמור להיכשל)';
    BEGIN
        INSERT INTO trip (trip_id, driver_id, route_id, bus_id, trip_date, departure_time, available_seats, plate_number)
        VALUES (
            (SELECT COALESCE(MAX(trip_id), 0) + 1 FROM trip),
            999999,
            (SELECT route_id FROM route LIMIT 1),
            (SELECT busid FROM vehicle LIMIT 1),
            CURRENT_DATE,
            0,
            50,
            (SELECT licenseplate::text FROM vehicle LIMIT 1)
        );
        RAISE WARNING 'כשלון: הטריגר לא חסם נהג לא קיים!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'הצלחה: הטריגר חסם! %', SQLERRM;
    END;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'תוכנית ראשית 2 הסתיימה בהצלחה';
    RAISE NOTICE '==================================================';
END;
$$;




