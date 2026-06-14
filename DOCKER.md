# הרצה עם Docker (מומלץ להגשה)

## דרישות

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / Mac / Linux)

## הכנה (פעם אחת)

משורש הפרויקט (`drivers/`):

```powershell
copy .env.example .env
```

ערכי ברירת המחדל ב-`.env.example` מספיקים להרצה.

## הרצה

```powershell
docker compose up --build
```

פתיחה בדפדפן: **http://localhost:3000**

## בדיקה

| בדיקה | כתובת | תוצאה צפויה |
|--------|--------|-------------|
| אפליקציה | http://localhost:3000 | מסך כניסה |
| API | http://localhost:3001/api/health | `{"status":"ok","database":"connected"}` |
| pgAdmin | http://localhost:8080 | התחברות עם `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` מ-`.env` |

## כניסה לאפליקציה

- **נהג:** מזהה קיים, למשל `1001` או `1131`
- **מנהל:** כפתור «כניסת מנהל» במסך הראשי

## עצירה

```powershell
docker compose down
```

מחיקת DB והתחלה מחדש (מוחק נתונים):

```powershell
docker compose down -v
docker compose up --build
```

## מה עולה ב-Docker

| שירות | תפקיד | פורט |
|--------|--------|------|
| `db` | PostgreSQL 17 + שחזור גיבוי `stage4/backup4` | פנימי |
| `api` | שרת Express (stage5) | 3001 |
| `web` | ממשק React (Vite) | 3000 |
| `pgadmin` | ניהול DB (אופציונלי) | 8080 |

## פתרון בעיות

| בעיה | פתרון |
|------|--------|
| פורט 3000/3001 תפוס | `docker compose down` → עצרי שרת Node מקומי |
| `database: disconnected` | המתיני ~30 שניות לשחזור DB; `docker compose logs db` |
| שינוי ב-`.env` לא נכנס | `docker compose down` ואז `docker compose up --build` |
| DB ריק / שגיאות restore | `docker compose down -v` ואז `docker compose up --build` |

## הרצה מקומית (לפיתוח)

ראי [stage5/הוראות-הפעלה.md](./stage5/הוראות-הפעלה.md)
