import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { apiRouter } from './routes/index.js';

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use('/api', apiRouter);

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
});

runMigrations().catch((err) => {
  console.error('Migration failed (server still running):', err);
});
