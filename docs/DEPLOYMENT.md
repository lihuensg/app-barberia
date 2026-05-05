# Deployment

## Frontend
- Vercel
- Definir `VITE_API_BASE_URL` apuntando al backend de producción

## Backend
- Render
- Variables requeridas: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BACKEND_URL`
- Si usás Cloudinary: `CLOUDINARY_ENABLED=true` y credenciales completas

## Database
- Neon PostgreSQL
- Ejecutar migraciones de Prisma en el despliegue

## Notes
- No usar `uploads/` como almacenamiento permanente.
- No subir secretos al frontend.
