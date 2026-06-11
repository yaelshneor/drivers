import pg from 'pg';
import { config } from '../config.js';

// מאגר חיבורים ל-PostgreSQL — פרטי ההתחברות מגיעים מ-config.db (קובץ .env)
export const pool = new pg.Pool(config.db);

// אם חיבור במאגר נופל (למשל Docker נעצר) — רושם שגיאה בלי להפיל את השרת
pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

// עוטף את pool.query — כל ה-routes משתמשים בפונקציה הזו להרצת SQL
// text: שאילתה עם $1, $2... | params: ערכים לפרמטרים (מונע SQL injection)
export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
