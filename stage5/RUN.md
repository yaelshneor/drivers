# שלב ה — הרצה

## מבנה

```
stage5/
  server/          ← Backend (Express + PostgreSQL)
    config.ts
    db/pool.ts
    routes/
    index.ts
  src/
    api/           ← קריאות API מהפרונט
    App.tsx        ← UI
```

## דרישות

- Node.js **18+**
- Docker + PostgreSQL (`DB_NAME_SECRET=stage3` ב-`.env` בשורש הפרויקט)

## התקנה

```bash
cd stage5
npm install
```

## הרצה (2 טרמינלים)

**טרמינל 1 — API + DB:**

```bash
docker compose up -d
cd stage5
npm run dev:server
```

בדיקה: http://localhost:3001/api/health  
צריך: `{"status":"ok","database":"connected"}`

**טרמינל 2 — פרונט:**

```bash
cd stage5
npm run dev
```

פתחי: http://localhost:3000

## כניסת נהג (מחובר ל-DB)

הזיני `driverid` אמיתי מהטבלה `driver` (למשל `1001`, `1131`).

## API

| Method | Path | תיאור |
|--------|------|--------|
| GET | `/api/health` | בדיקת חיבור DB |
| GET | `/api/drivers/:id` | שליפת נהג לפי מזהה |
