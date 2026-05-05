# PRODUCCIÓN - NazaBarber Backend

**Objetivo**: Guía completa para deployar NazaBarber Backend en producción usando **Render**, **Neon PostgreSQL**, **Cloudinary** y conectar con frontend en **Vercel**.

---

## Checklist Pre-Producción

- [ ] Backend testeado localmente ✅
- [ ] JWT_SECRET configurado (mínimo 32 caracteres, seguro)
- [ ] DATABASE_URL de Neon obtenida
- [ ] Cloudinary API configurada (si se usan imágenes)
- [ ] Variables de entorno lisas para Render
- [ ] CORS configurado para Vercel
- [ ] Frontend compilado sin errores
- [ ] VITE_API_BASE_URL del frontend apunta a Render

---

## 1. Base de Datos: Neon PostgreSQL

### Crear proyecto en Neon

1. Ir a https://neon.tech (gratuito con límites generosos)
2. Crear cuenta
3. Crear nuevo proyecto (base de datos PostgreSQL)
4. Nombre sugerido: `nazabarber`
5. Región: elegir más cercana a tus usuarios
6. Obtener connection string

### Connection String

Neon te proporciona algo como:

```
postgresql://user:password@host.neon.tech:5432/database?sslmode=require
```

**Importante**:
- Neon requiere `sslmode=require`
- No cambiar la URL, usarla tal cual en Render

### Migraciones en Neon

Una vez que Render está deployado (paso 5), ejecutar migraciones:

```bash
# Localmente, con la DATABASE_URL de Neon
DATABASE_URL="postgresql://..." npx prisma migrate deploy --schema=prisma/schema.prisma

# Luego seed (opcional)
DATABASE_URL="postgresql://..." npx prisma db seed --schema=prisma/schema.prisma
```

---

## 2. Cloudinary (Almacenamiento de Imágenes)

### Crear cuenta Cloudinary

1. Ir a https://cloudinary.com (gratuito con 25GB de almacenamiento)
2. Crear cuenta
3. Ir a Dashboard
4. Obtener:
   - `Cloud Name` (visible en dashboard)
   - `API Key` (visible en dashboard)
   - `API Secret` (generate si no existe)

### Configurar en Render

Agregar variables en Render (paso 3):

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=nazabarber
CLOUDINARY_ENABLED=true
```

**Seguridad**:
- Nunca exponer `CLOUDINARY_API_SECRET` en el frontend
- Las credenciales van solo en Render/backend
- El frontend solo recibe URLs públicas (`secure_url`)

---

## 3. Backend en Render

### Crear Render Web Service

1. Ir a https://render.com
2. Conectar repositorio GitHub (fork o private)
3. Crear nuevo "Web Service"
4. Seleccionar repositorio y rama (`main` o `production`)
5. Nombre sugerido: `nazabarber-backend`
6. Ambiente: `Node`
7. Build command: `cd backend && npm install && npx prisma generate --schema=prisma/schema.prisma`
8. Start command: `cd backend && npm start`
9. Region: elegir cerca de Neon

### Variables de Entorno en Render

Agregar en Render dashboard (Environment):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require
JWT_SECRET=tu_secreto_largo_y_seguro_minimo_32_caracteres_change_me_123456789abc
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=otro_secreto_largo_minimo_32_caracteres_change_me_987654321xyz
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=https://tu-frontend-vercel.vercel.app
BACKEND_URL=https://nazabarber-backend-xxxxx.onrender.com
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=nazabarber
CLOUDINARY_ENABLED=true
RESEND_API_KEY=re_abc123...
MAIL_FROM=NazaBarber <no-reply@tudominio.com>
```

**Importante**:
- Reemplazar valores ficticios con valores reales
- Usar secrets strong para JWT_SECRET y REFRESH_TOKEN_SECRET
- FRONTEND_URL y BACKEND_URL son valores reales de Vercel/Render
- RESEND_API_KEY obtener de https://resend.com/api-keys
- MAIL_FROM es el email remitente (usar dominio verificado en Resend para producción)

### Configurar Resend Email (Nuevo)

El backend ahora soporta recuperación de contraseña via email con Resend.

#### Setup Local (Desarrollo)

```env
RESEND_API_KEY=          # Déjar vacío
MAIL_FROM=NazaBarber <onboarding@resend.dev>
```

En desarrollo, los emails se loguean en consola (no se envían).

#### Setup Producción (Render)

1. **Crear cuenta en Resend:**
   - Ir a https://resend.com
   - Signup gratuito
   - Crear API key en https://resend.com/api-keys
   - Copiar API key (algo como: `re_abc123...`)

2. **En Render Environment Variables:**
   ```
   RESEND_API_KEY=re_abc123...
   MAIL_FROM=NazaBarber <no-reply@tudominio.com>
   ```

3. **Para emails desde dominio real (recomendado):**
   - Ir a https://resend.com/domains
   - Agregar tu dominio (e.g., tudominio.com)
   - Verificar DNS records según instrucciones
   - Cambiar MAIL_FROM a: `NazaBarber <noreply@tudominio.com>`

#### Endpoints Nuevos

- `POST /api/auth/forgot-password` - Solicita recuperación
- `POST /api/auth/reset-password` - Completa recuperación

Ver [PASSWORD_RESET_SETUP.md](PASSWORD_RESET_SETUP.md) para detalles.

### Build & Deploy

1. Render construirá automáticamente
2. Esperar a que finalice el deploy
3. Notar la URL:  `https://nazabarber-backend-xxxxx.onrender.com`
4. Probar health check:
   ```
   curl https://nazabarber-backend-xxxxx.onrender.com/api/healthz
   ```

---

## 4. Frontend en Vercel

### Build Production

```bash
cd frontend
npm run build
```

Debe compilar sin errores. Output en `frontend/dist/`.

### Deploy en Vercel

#### Opción A: Conectar GitHub (recomendado)

1. Ir a https://vercel.com
2. Conectar repositorio GitHub
3. Seleccionar repo y rama
4. Configurar:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./frontend`

#### Opción B: Deploy manual

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Variables de Entorno en Vercel

Agregar en Vercel dashboard (Settings → Environment Variables):

```
VITE_API_BASE_URL=https://nazabarber-backend-xxxxx.onrender.com
```

**Importante**:
- NO incluir `/api` en la URL
- El cliente generado agrega `/api` automáticamente
- Las requests irán a: `https://nazabarber-backend.../api/...`

### Redeploy después de cambios

Si cambias env en Vercel, redeploy automáticamente:

```bash
git push main
# Vercel redeploy automáticamente
```

O redeploy manual:

```bash
vercel --prod
```

---

## 5. Testing Post-Deploy

Después de todo deployado, probar en producción:

### Health Check

```bash
curl https://nazabarber-backend-xxxxx.onrender.com/api/healthz
# Respuesta: {"status":"ok"}
```

### Login

```bash
curl -X POST https://nazabarber-backend-xxxxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nazabarber.com",
    "password": "admin123"
  }'

# Respuesta: token + usuario
```

### Frontend

1. Abrir https://tu-frontend-vercel.vercel.app
2. Login con admin@nazabarber.com / admin123
3. Probar flujos:
   - Ver turnos disponibles
   - Reservar turno
   - Ver posts
   - Dar likes

### Monitor

1. Render dashboard: revisar logs y métricas
2. Vercel dashboard: revisar builds y deployments
3. Neon dashboard: revisar queries y performance

---

## 6. Seguridad en Producción

### JWT_SECRET

Generar un string aleatorio fuerte:

```bash
# Opción 1: Linux/Mac
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Usar el valor generado en `JWT_SECRET` de Render.

### CORS

El backend valida que FRONTEND_URL sea el origin permitido. Requests desde otro dominio son rechazadas.

### Rate Limiting

Auth endpoints tienen rate limits configurados:
- Login: 5 intentos cada 15 minutos por IP
- Registro: 10 intentos por hora por IP
- Forgot password: 3 intentos cada 30 minutos por IP

Intentos excedidos retornan: `"Demasiados intentos. Probá nuevamente más tarde."`

### Headers de Seguridad

Helmet configurado en backend agrega headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (en producción)

---

## 7. Troubleshooting

### El backend no conecta con la base de datos

**Causa**: DATABASE_URL incorrecto.

**Solución**:
1. Verificar que Neon connection string esté exacto (con `?sslmode=require`)
2. Verificar que `sslmode=require` esté presente
3. En Render, verificar variable en Environment (sin caracteres extras)
4. Revisar logs: `tail -f logs/render.log`

### Migraciones no se aplican

**Causa**: Render no ejecuta migraciones automáticamente.

**Solución**:
1. Agregar a Build command en Render:
   ```
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
2. O ejecutar manualmente localmente:
   ```
   DATABASE_URL="..." npx prisma migrate deploy
   ```

### El frontend no conecta con backend

**Causa**: VITE_API_BASE_URL incorrecto o CORS bloqueado.

**Solución**:
1. Verificar VITE_API_BASE_URL en Vercel (debe ser URL de Render sin `/api`)
2. Verificar FRONTEND_URL en Render (debe ser URL de Vercel sin path)
3. Revisar DevTools → Network → ver si hay error CORS
4. Si hay CORS error, el origin no es permitido

### Rate limit bloquea login

**Causa**: Demasiados intentos de login fallidos.

**Solución**:
- Esperar 15 minutos para intentar nuevamente (o cambiar límite en código)
- Verificar que email/password sean correctos

### Imágenes no se cargan

**Causa**: Cloudinary no configurado o URLs rotas.

**Solución**:
1. Si `CLOUDINARY_ENABLED=false`: usa URLs remotas o data-URLs (solo desarrollo)
2. Si `CLOUDINARY_ENABLED=true`: verificar credenciales en Render
3. Verificar que las imágenes estén subidas a Cloudinary
4. Revisar `secure_url` en base de datos

---

## 8. Backups y Recuperación

### Backup de Base de Datos (Neon)

Neon hace backups automáticos. Para backup manual:

1. Ir a Neon dashboard
2. Seleccionar branch
3. Descargar dump:
   ```
   pg_dump postgresql://user:password@host:5432/database > backup.sql
   ```

### Restore

```bash
psql postgresql://user:password@host:5432/database < backup.sql
```

### Git

Mantener histórico en GitHub:

```bash
git push origin main
git tag production-1.0.0
git push origin production-1.0.0
```

---

## 9. Escalabilidad Futura

### Después de MVP:

1. **Caché**: Redis en Render (para sesiones/queries)
2. **Base de datos secundaria**: Read replicas en Neon
3. **Monitoreo**: Sentry para errores
4. **Logs**: LogRocket o similar
5. **Analytics**: PostHog o Plausible
6. **Email**: SendGrid o Mailgun (para recuperación contraseña, etc.)
7. **Storage**: Cloudinary + CDN global

---

## 10. Rollback

Si algo falla en producción:

### Opción 1: Rollback en Render

1. Render dashboard
2. Seleccionar deployment anterior
3. Click "Deploy"

### Opción 2: Rollback en GitHub

```bash
git revert <commit-que-rompió>
git push main
# Vercel/Render redeploy automáticamente
```

---

## Checklist Final

- [ ] Database URL de Neon en Render
- [ ] JWT_SECRET seguro (32+ caracteres, no débil)
- [ ] Cloudinary credenciales en Render
- [ ] Frontend URL correcto en Render
- [ ] Backend URL correcto en Vercel
- [ ] Health check funciona
- [ ] Login en producción funciona
- [ ] CORS permite frontend
- [ ] Imágenes se suben correctamente
- [ ] Logs visibles en Render/Vercel
- [ ] Rate limits funcionan
- [ ] JWT expira después de 15 minutos

---

**Frontend**: https://vercel.com/docs  
**Backend**: https://render.com/docs  
**Database**: https://neon.tech/docs  
**Images**: https://cloudinary.com/documentation  

**¡Listo! 🚀**
