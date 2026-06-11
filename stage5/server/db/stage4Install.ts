import { query } from './pool.js';

export async function installStage4Objects() {
  await query(`DROP FUNCTION IF EXISTS get_driver_top_region_activity(integer)`);
  await query(`
    CREATE OR REPLACE FUNCTION get_driver_top_region_activity(p_driver_id INT)
    RETURNS TABLE (
      driver_name TEXT,
      top_region_name TEXT,
      trip_count INT,
      route_count INT,
      status TEXT
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_top_region INT;
      v_region_name TEXT;
      v_trip_count INT;
      v_route_count INT;
    BEGIN
      SELECT fullname INTO driver_name FROM driver WHERE driverid = p_driver_id;
      IF driver_name IS NULL THEN
        RAISE EXCEPTION 'Driver not found';
      END IF;

      SELECT r.region_id, reg.regio_name INTO v_top_region, v_region_name
      FROM trip t
      JOIN route r ON t.route_id = r.route_id
      JOIN region reg ON reg.region_id = r.region_id
      WHERE t.driver_id = p_driver_id
      GROUP BY r.region_id, reg.regio_name
      ORDER BY COUNT(*) DESC
      LIMIT 1;

      IF v_top_region IS NULL THEN
        top_region_name := NULL;
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

      top_region_name := v_region_name;
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
  `);

  await query(`
    DROP PROCEDURE IF EXISTS update_route_statistics(refcursor);
    CREATE OR REPLACE PROCEDURE update_route_statistics(INOUT updated_routes REFCURSOR DEFAULT NULL)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      route_cur CURSOR FOR SELECT route_id, estimated_duration_minutes FROM route;
      rec_route RECORD;
      v_trip_count INT;
    BEGIN
      OPEN route_cur;
      LOOP
        FETCH route_cur INTO rec_route;
        EXIT WHEN NOT FOUND;
        SELECT COUNT(*)::INT INTO v_trip_count FROM trip WHERE route_id = rec_route.route_id;
        IF v_trip_count = 0 THEN
          UPDATE route SET estimated_duration_minutes = GREATEST(1, estimated_duration_minutes - 1)
          WHERE route_id = rec_route.route_id;
        ELSIF v_trip_count BETWEEN 1 AND 5 THEN
          UPDATE route SET estimated_duration_minutes = estimated_duration_minutes + 2
          WHERE route_id = rec_route.route_id;
        ELSE
          UPDATE route SET estimated_duration_minutes = GREATEST(1, estimated_duration_minutes - 2)
          WHERE route_id = rec_route.route_id;
        END IF;
      END LOOP;
      CLOSE route_cur;
      OPEN updated_routes FOR
        SELECT route_id, estimated_duration_minutes FROM route ORDER BY route_id;
    END;
    $$;
  `);

  await query(`DROP TRIGGER IF EXISTS trg_validate_driver ON trip`);
  await query(`DROP FUNCTION IF EXISTS validate_driver_before_trip()`);
  await query(`
    CREATE OR REPLACE FUNCTION validate_driver_before_trip()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_exists INT;
    BEGIN
      SELECT COUNT(*) INTO v_exists FROM driver WHERE driverid = NEW.driver_id;
      IF v_exists = 0 THEN
        RAISE EXCEPTION 'Driver % does not exist', NEW.driver_id;
      END IF;
      RETURN NEW;
    END;
    $$;
  `);
  await query(`
    CREATE TRIGGER trg_validate_driver
    BEFORE INSERT ON trip
    FOR EACH ROW
    EXECUTE FUNCTION validate_driver_before_trip();
  `);
}
