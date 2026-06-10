/* transactions commit */

BEGIN TRANSACTION;
UPDATE driver
SET phone = '050-8768468'
WHERE driverid = 1001;
SELECT driverid, fullname, phone FROM driver WHERE driverid = 1001;
COMMIT;
SELECT driverid, fullname, phone FROM driver WHERE driverid = 1001;

/* transactions rollback */
BEGIN TRANSACTION;
UPDATE driver
SET fullname = 'yael'
WHERE driverid = 1001;
SELECT driverid, fullname, phone FROM driver WHERE driverid = 1001;
ROLLBACK;
SELECT driverid, fullname, phone FROM driver WHERE driverid = 1001;
