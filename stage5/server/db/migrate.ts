import { query } from './pool.js';
import { installStage4Objects } from './stage4Install.js';

export async function runMigrations() {
  await query(
    `ALTER TABLE trip ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'`,
  );
  await query(
    `ALTER TABLE driver ALTER COLUMN licensetype TYPE VARCHAR(50)`,
  );
  await installStage4Objects();
}
