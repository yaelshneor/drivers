import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { apiRouter } from './routes/index.js';

// יצירת אפליקציית Express — זה השרת שמאזין לבקשות מה-React
const app = express();

// מאפשר לפרונט (localhost:3000) לשלוח בקשות לשרת — בלי זה הדפדפן חוסם
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));

// מפרש גוף בקשות JSON (למשל PUT /api/drivers עם name, phone)
app.use(express.json());

// כל ה-API תחת /api — drivers, trips, routes וכו'
app.use('/api', apiRouter);

// מפעיל את השרת על פורט 3001 (או API_PORT מ-.env)
app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
  console.log('Endpoints: /api/drivers /api/vehicles /api/routes /api/trips');
});

// בעליית השרת: מעדכן סכמת DB ומתקין פונקציה/פרוצדורה/טריגר משלב ד'
// אם נכשל — השרת ממשיך לרוץ, רק מדפיס שגיאה
runMigrations().catch((err) => {
  console.error('Migration failed (server still running):', err);
});
