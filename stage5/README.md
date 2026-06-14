# שלב ה — אפליקציית Web

**[הרצה עם Docker](../DOCKER.md)** · [הוראות מפורטות](./הוראות-הפעלה.md)

## הרצה מהירה (Docker)

```powershell
# משורש drivers/
copy .env.example .env
docker compose up --build
```

http://localhost:3000

## הרצה מקומית (פיתוח)

```powershell
docker compose up -d db pgadmin
cd stage5
npm install
npm run dev:server   # טרמינל 1
npm run dev          # טרמינל 2
```
