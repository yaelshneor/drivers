import { query } from './pool.js';

export async function runMigrations() {
  await query(
    `ALTER TABLE trip ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'`,
  );
}
