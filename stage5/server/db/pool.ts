import pg from 'pg';
import { config } from '../config.js';

export const pool = new pg.Pool(config.db);

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
});

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
