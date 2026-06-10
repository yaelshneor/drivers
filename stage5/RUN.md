# שלב ה — הרצת הממשק (React)

## דרישות

- **Node.js 18+** (חובה — Vite 6 לא עובד על Node 10)
- npm

בדיקה:

```bash
node -v
```

אם מוצג `v10.x` — יש לעדכן Node מ-[https://nodejs.org](https://nodejs.org) (LTS) ולפתוח מחדש את הטרמינל.

## התקנה והרצה

```bash
cd stage5
npm install
npm run dev
```

פתחי בדפדפן: **http://localhost:3000**

## בדיקה עם Mock (לפני חיבור DB)

הפרונט כרגע עובד עם נתונים מ-[`src/mockData.ts`](./src/mockData.ts):

| פעולה | ערך לדוגמה |
|--------|------------|
| כניסת נהג | מזהה `101`, `102` או `103` |
| כניסת מנהל | כפתור «כניסת מנהל» |

אם המסכים נטענים — הפרונט תקין. אחר כך נחבר ל-PostgreSQL.

## שלב הבא — חיבור DB (מסך מסך)

1. **Backend** — Express + `pg` (API ב-`stage5/server/`)
2. **מסך כניסה / נהגים** — שליפת `driver` מ-DB
3. **נסיעות** — `trip` + JOIN לשמות (route, bus, driver)
4. **מנהל** — CRUD + שאילתות משלב ב' + פונקציות/פרוצדורות משלב ד'

Docker (PostgreSQL):

```bash
docker compose up -d
```

קובץ `.env` בשורש הפרויקט: `DB_USER_SECRET`, `DB_PASSWORD_SECRET`, `DB_NAME_SECRET`.
