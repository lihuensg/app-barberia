# Setup

## Backend
```bash
cd backend
npm install
npx prisma migrate dev --schema=prisma/schema.prisma
npx prisma db seed --schema=prisma/schema.prisma
npm run dev
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno
- Copiá `backend/.env.example` a `backend/.env`
- Copiá `frontend/.env.example` a `frontend/.env`
- No subas `.env` reales al repositorio
