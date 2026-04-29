import os
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch
from faker import Faker


def _load_env():
    p = Path(__file__).resolve().parent.parent / ".env"
    if not p.is_file():
        return
    for raw in p.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip()
        if k and k not in os.environ:
            os.environ[k] = v


_load_env()

DB_HOST = os.environ.get("PGHOST") or os.environ.get("DB_HOST") or "localhost"
try:
    DB_PORT = int(os.environ.get("PGPORT") or os.environ.get("DB_PORT") or "5432")
except ValueError:
    DB_PORT = 5432
DB_NAME = os.environ.get("PGDATABASE") or os.environ.get("INSERT_DB") or "postgres"
DB_USER = os.environ.get("PGUSER") or os.environ.get("INSERT_USER") or "postgres"
DB_PASSWORD = os.environ.get("PGPASSWORD") or os.environ.get("INSERT_PASSWORD") or "postgres"

BUS_LO, BUS_HI = 1201, 2000
RS_LO, RS_HI = 201, 500

SQL_OUT = Path(__file__).resolve().parent / "generated_inserts.sql"
DDL_SQL = Path(__file__).resolve().parent.parent / "scripts" / "create-tables.sql"
WRITE_SQL_FILE = True
RUN_DATABASE = True

MFG = ("Mercedes", "Volvo", "Scania", "MAN", "Iveco")
LIC = ("A", "B", "C", "D")

fake = Faker()


def esc(s):
    return str(s).replace("'", "''")


def apply_ddl_if_needed(cur):
    cur.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bus'"
    )
    if cur.fetchone():
        return
    if not DDL_SQL.is_file():
        raise FileNotFoundError(str(DDL_SQL))
    for part in DDL_SQL.read_text(encoding="utf-8").split(";"):
        s = part.strip()
        if s:
            cur.execute(s + ";")


def gen_bus(i):
    return (
        i,
        100000 + i,
        20 + (i % 35),
        MFG[(i - 1) % 5],
        f"M{(i - 1) % 20 + 1}",
        2010 + (i % 16),
    )


def gen_route(i):
    rn = (fake.catch_phrase() or f"Line {i}")[:50]
    start = (fake.city() + " Dep")[:50]
    end = (fake.city() + " Arr")[:50]
    return (i, rn, start, end, 16 + (i % 120))


def gen_stop(i, base):
    o = i - base
    sn = (f"{fake.street_name()} Stop")[:100]
    addr = (fake.address().replace("\n", ", "))[:100]
    return (
        i,
        sn,
        addr,
        round(32.08 + o * 0.0001, 6),
        round(34.78 + o * 0.0001, 6),
    )


def gen_driver(i):
    return (i, (fake.name())[:100], LIC[(i - 1) % 4])


def gen_routestop(i, base):
    return ((i - base) % 12 + 1, i, i)


def gen_trip(bus_driver_id):
    rid = RS_LO + (bus_driver_id - BUS_LO) % (RS_HI - RS_LO + 1)
    return (bus_driver_id, bus_driver_id, rid, bus_driver_id)


def _bulk(prefix, rows, fmt):
    if not rows:
        return ""
    body = ",\n".join(fmt(t) for t in rows)
    return f"{prefix} VALUES\n{body};"


def rows_to_sql(bus_rows, driver_rows, route_rows, stop_rows, rs_rows, trip_rows):
    parts = [
        _bulk(
            "INSERT INTO bus (busid, licenseplate, capacity, manufacturer, model, year)",
            bus_rows,
            lambda t: f"({t[0]}, {t[1]}, {t[2]}, '{esc(t[3])}', '{esc(t[4])}', {t[5]})",
        ),
        _bulk(
            "INSERT INTO driver (driverid, fullname, licensetype)",
            driver_rows,
            lambda t: f"({t[0]}, '{esc(t[1])}', '{esc(t[2])}')",
        ),
        _bulk(
            "INSERT INTO route (routeid, routename, startlocation, endlocation, estimatedduration)",
            route_rows,
            lambda t: f"({t[0]}, '{esc(t[1])}', '{esc(t[2])}', '{esc(t[3])}', {t[4]})",
        ),
        _bulk(
            "INSERT INTO stop (stopid, stopname, address, latitude, longitude)",
            stop_rows,
            lambda t: f"({t[0]}, '{esc(t[1])}', '{esc(t[2])}', {t[3]}, {t[4]})",
        ),
        _bulk(
            "INSERT INTO routestop (stoporder, routeid, stopid)",
            rs_rows,
            lambda t: f"({t[0]}, {t[1]}, {t[2]})",
        ),
        _bulk(
            "INSERT INTO trip (tripid, driverid, routeid, busid)",
            trip_rows,
            lambda t: f"({t[0]}, {t[1]}, {t[2]}, {t[3]})",
        ),
    ]
    return "\n\n".join(p for p in parts if p)


def main():
    bus_ids = range(BUS_LO, BUS_HI + 1)
    rs_ids = range(RS_LO, RS_HI + 1)

    bus_rows = [gen_bus(i) for i in bus_ids]
    driver_rows = [gen_driver(i) for i in bus_ids]
    route_rows = [gen_route(i) for i in rs_ids]
    stop_rows = [gen_stop(i, RS_LO) for i in rs_ids]
    rs_rows = [gen_routestop(i, RS_LO) for i in rs_ids]
    trip_rows = [gen_trip(i) for i in bus_ids]

    if WRITE_SQL_FILE:
        SQL_OUT.write_text(
            rows_to_sql(bus_rows, driver_rows, route_rows, stop_rows, rs_rows, trip_rows),
            encoding="utf-8",
        )
        print(f"נוצר קובץ SQL: {SQL_OUT}")

    if not RUN_DATABASE:
        return

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10,
    )
    try:
        cur = conn.cursor()
        cur.execute("SELECT current_database()")
        print(f"PostgreSQL: db={cur.fetchone()[0]} host={DB_HOST} port={DB_PORT} user={DB_USER}")
        apply_ddl_if_needed(cur)
        execute_batch(
            cur,
            "INSERT INTO bus (busid, licenseplate, capacity, manufacturer, model, year) VALUES (%s,%s,%s,%s,%s,%s)",
            bus_rows,
        )
        execute_batch(
            cur,
            "INSERT INTO driver (driverid, fullname, licensetype) VALUES (%s,%s,%s)",
            driver_rows,
        )
        execute_batch(
            cur,
            "INSERT INTO route (routeid, routename, startlocation, endlocation, estimatedduration) VALUES (%s,%s,%s,%s,%s)",
            route_rows,
        )
        execute_batch(
            cur,
            "INSERT INTO stop (stopid, stopname, address, latitude, longitude) VALUES (%s,%s,%s,%s,%s)",
            stop_rows,
        )
        execute_batch(
            cur,
            "INSERT INTO routestop (stoporder, routeid, stopid) VALUES (%s,%s,%s)",
            rs_rows,
        )
        execute_batch(
            cur,
            "INSERT INTO trip (tripid, driverid, routeid, busid) VALUES (%s,%s,%s,%s)",
            trip_rows,
        )
        conn.commit()
        print("הנתונים הוכנסו ל-PostgreSQL בהצלחה.")
    except Exception as e:
        conn.rollback()
        print(f"שגיאת מסד נתונים: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("מייצר נתונים...")
    main()

