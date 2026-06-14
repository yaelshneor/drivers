import { query } from './pool.js';
import { installStage4Objects } from './stage4Install.js';

export async function runMigrations() {
  await installStage4Objects();
}
