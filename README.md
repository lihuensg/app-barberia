# NazaBarber

NazaBarber es una app full-stack para gestión de turnos de barbería con panel admin, clientes y portfolio / red social.

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + Vite
- Auth: JWT
- Emails: Resend
- Imágenes: Cloudinary

## Funcionalidades
- Login y registro
- Recuperación de contraseña
- Reserva de turnos
- Historial de cliente
- Panel admin
- Gestión de turnos y métricas
- Posts / portfolio
- Likes y comentarios

## Requisitos
- Node.js
- npm
- PostgreSQL

## Setup local
1. Copiá los archivos de ejemplo de entorno:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
2. Configurá las variables locales.
3. Instalá dependencias y corré migraciones en backend.
4. Instalá dependencias y levantá frontend.

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --schema=prisma/schema.prisma
npx prisma db seed --schema=prisma/schema.prisma
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## URLs locales
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Seguridad
- No subas archivos `.env` reales.
- Usá solo los `.env.example` como referencia.
- Las credenciales reales van únicamente en el backend.

## Deploy futuro
- Frontend: Vercel
- Backend: Render
- Base de datos: Neon PostgreSQL
- Imágenes: Cloudinary

## Documentación
- [Setup](docs/SETUP.md)
- [Seguridad](docs/SECURITY.md)
- [Reglas de negocio](docs/BUSINESS_RULES.md)
- [QA checklist](docs/QA_CHECKLIST.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Cloudinary](backend/CLOUDINARY_SETUP.md)
