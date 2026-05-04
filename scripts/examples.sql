/* הוספת עמודה חדשה לטבלת נהגים */
ALTER TABLE driver ADD COLUMN IF NOT EXISTS Phone VARCHAR(20);

/* עדכון עמודה חדשה בטבלת נהגים */
UPDATE driver
SET Phone = '050-' || LPAD(DriverID::TEXT, 7, '0');
