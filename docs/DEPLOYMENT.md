# Deployment Producción (Neon + Render + Vercel)

Este documento deja la app NazaBarber lista para deploy real sin exponer secretos.

## 1. Pre-check de repositorio

Verificar antes de desplegar:

- `.env` reales no se suben (solo `.env.example`).
- `node_modules`, `dist`, `build`, `uploads` y logs están ignorados.
- No hay claves reales en código ni documentación.
- Frontend compila y backend levanta local.

Comandos útiles:

```bash
git status -sb
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run build
```

## 2. GitHub

Si todavía no está publicado:

```bash
git add .
git commit -m "Initial production-ready commit - NazaBarber"
git remote add origin https://github.com/lihuensg/app-barberia.git
git branch -M main
git push -u origin main
```

Si `origin` ya existe:

```bash
git remote -v
git remote set-url origin https://github.com/lihuensg/app-barberia.git
git push -u origin main
```

## 3. Neon (PostgreSQL)

1. Crear proyecto `nazabarber`.
2. Crear base `nazabarber`.
3. Copiar `DATABASE_URL` desde Connect.
4. Guardar esa URL solo en Render (no en GitHub, no en frontend).

Formato esperado:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

## 4. Backend en Render

Crear Web Service con:

- Repo: `lihuensg/app-barberia`
- Root Directory: `backend`
- Runtime: Node
- Build Command:

```bash
npm install && npm run prisma:generate && npm run prisma:migrate:deploy
```

- Start Command:

```bash
npm start
```

### Variables de entorno en Render

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=<Neon>

JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<min 32 chars>
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=<url vercel>
BACKEND_URL=<url render>

RESEND_API_KEY=<real>
MAIL_FROM=NazaBarber <onboarding@resend.dev>

CLOUDINARY_ENABLED=true
CLOUDINARY_CLOUD_NAME=<real>
CLOUDINARY_API_KEY=<real>
CLOUDINARY_API_SECRET=<real>
CLOUDINARY_FOLDER=nazabarber

MIN_BOOKING_NOTICE_MINUTES=30
CANCEL_MIN_HOURS=3

AUDIT_ENABLED=true
AUDIT_RETENTION_DAYS=90
```

Notas:

- Si todavía no existe Vercel URL, usar temporalmente `FRONTEND_URL=http://localhost:5174`, luego actualizar y redeploy.
- CORS en producción ya está restringido a `FRONTEND_URL`.

## 5. Prisma en producción

Esta app usa Prisma con migraciones versionadas.

- No usar `prisma migrate dev` en producción.
- Usar `prisma migrate deploy`.
- Ejecutar `prisma generate` en build de Render.

Scripts disponibles en backend:

- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run seed:prod`

## 6. Health check

Endpoint:

```http
GET /api/healthz
```

Prueba:

```text
https://TU-BACKEND.onrender.com/api/healthz
```

Debe devolver estado ok.

## 7. Crear admin seguro (seed)

El seed usa upsert para no duplicar admin.

Variables recomendadas en Render para seed:

```env
ADMIN_EMAIL=admin@nazabarber.com
ADMIN_PASSWORD=<fuerte, minimo 12 chars>
ADMIN_NOMBRE=Naza Barber
ADMIN_TELEFONO=3430000000
ADMIN_INSTAGRAM=@nazabarber
ADMIN_WHATSAPP=3430000000
```

Ejecutar una vez:

```bash
npm run seed:prod
```

## 8. Frontend en Vercel

Crear proyecto con:

- Repo: `lihuensg/app-barberia`
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Variable requerida:

```env
VITE_API_BASE_URL=https://TU-BACKEND.onrender.com
```

Importante: sin `/api` al final, porque el cliente ya llama endpoints `/api/...`.

## 9. Actualización cruzada final

Cuando ya tengas ambas URLs:

1. Actualizar `FRONTEND_URL` en Render con la URL real de Vercel.
2. Confirmar `BACKEND_URL` con la URL real de Render.
3. Redeploy backend.
4. Redeploy frontend si cambió `VITE_API_BASE_URL`.

## 10. Resend (password reset)

Verificar en producción:

- Forgot password envía mail real.
- Link abre Vercel (no localhost).
- Reset password finaliza correctamente.

## 11. Cloudinary

- Secretos solo en Render.
- Frontend nunca recibe API secret.
- Subidas pasan por backend.

Pruebas mínimas:

- Subir foto de perfil.
- Crear post con imagen.
- Verificar URL en Neon y asset en Cloudinary.

## 12. Checklist final

GitHub:

- Código subido.
- Sin `.env` reales.
- Sin secretos en repo.

Neon:

- DB creada.
- `DATABASE_URL` configurada en Render.
- Migraciones aplicadas.

Render:

- Deploy exitoso.
- `healthz` responde.
- Logs sin errores críticos.

Vercel:

- Deploy exitoso.
- `VITE_API_BASE_URL` correcto.
- Requests saliendo a Render (no localhost).

Aplicación:

- Login cliente/admin.
- Turnos, dashboard y admin.
- Forgot/reset password.
- Upload de imágenes.
- CORS sin errores.

## 13. Errores comunes

- CORS rechazado: `FRONTEND_URL` mal configurado en Render.
- 404/500 en frontend: `VITE_API_BASE_URL` con `/api` duplicado.
- Backend no arranca: `DATABASE_URL` inválida o faltan secrets.
- Prisma error al iniciar: faltó `prisma generate`.
- Cambios de schema no aplicados: se usó mal `migrate dev` en producción.
- Reset password con localhost: `FRONTEND_URL` quedó en local.
- Upload falla: Cloudinary incompleto o `CLOUDINARY_ENABLED=true` sin credenciales.
