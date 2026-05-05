# 🔐 NazaBarber Backend - Guía de Seguridad

**Última actualización**: 1 de mayo de 2026  
**Versión Backend**: 1.0.0 (PARTE 1 de Seguridad implementada)

---

## 📍 Ubicación de Archivos Importantes

### Configuración y Variables de Entorno
- **`.env`** ← Tu archivo local (NO commitear)
- **`.env.example`** ← Ejemplo con todas las variables (commiteable)
- **`src/config/env.js`** ← Validación centralizada (ejecutada al iniciar)
- **`src/config/prisma.js`** ← Configuración de Prisma
- **`src/config/cloudinary.js`** ← Preparado para imágenes en la nube

### Seguridad
- **`src/middlewares/rateLimiter.middleware.js`** ← Rate limiting
- **`src/utils/sanitize.js`** ← Funciones para sanitizar datos
- **`.gitignore`** ← Archivos a ignorar (actualizado)

### Documentación
- **`PRODUCCION.md`** ← Guía completa de deployment
- **`SECURITY_CHANGES.md`** ← Resumen de cambios de seguridad (PARTE 1)
- **`../docs/SETUP.md`** ← Guía general de setup del proyecto

---

## 🚀 Arrancar el Backend Localmente

### Paso 1: Preparar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Verificar que .env tenga valores válidos (para local, ya están listos)
# DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nazabarber
# JWT_SECRET=dev_secret_key_only_for_local_development...
# JWT_EXPIRES_IN=15m
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Se instalarán:
- helmet (seguridad: headers)
- express-rate-limit (seguridad: rate limiting)
- ...y las demás existentes

### Paso 3: Aplicar migraciones (si no se han aplicado)

```bash
npx prisma migrate dev --name init --schema=prisma/schema.prisma
```

### Paso 4: Seed inicial (crear admin)

```bash
npx prisma db seed --schema=prisma/schema.prisma
```

### Paso 5: Arrancar desarrollo

```bash
npm run dev
```

**Output esperado:**
```
✅ Variables de entorno validadas correctamente
✅ Ambiente: DEVELOPMENT
ℹ️ Cloudinary deshabilitado (CLOUDINARY_ENABLED=false)

🧔 NazaBarber API v1.0
Corriendo en puerto 3000
Ambiente: DEVELOPMENT

ℹ️ CORS permitidos: [...]
ℹ️ Database: ✅ Conectado
ℹ️ Cloudinary: ❌ Deshabilitado
```

Si ves algún ❌ en lugar de ✅, revisa el mensaje de error.

---

## 🔑 Credenciales de Prueba

Después del seed, puedes usar:

**Admin:**
- Email: `admin@nazabarber.com`
- Password: `admin123`

---

## 📋 Cambios de Seguridad Implementados (PARTE 1)

### 9. **Reglas de negocio de turnos**
   - `MIN_BOOKING_NOTICE_MINUTES` controla el mínimo de anticipación para reservar desde la app
   - `CANCEL_MIN_HOURS` controla el mínimo de horas para cancelar desde la app
   - `GET /api/turnos/disponibles` no devuelve turnos pasados ni turnos dentro del margen mínimo
   - `POST /api/turnos/cliente` y `POST /api/turnos/anonimo` rechazan turnos pasados o demasiado próximos
   - Un cliente autenticado solo puede tener 1 turno activo futuro a la vez
   - El admin conserva visibilidad de turnos pasados en `GET /api/turnos/admin`
   - La reserva se ejecuta con protección atómica para evitar doble reserva

### 1. **Variables de Entorno Validadas**
   - Si falta `JWT_SECRET` → servidor no arranca
   - Si falta `DATABASE_URL` → servidor no arranca
   - En producción, valida que secrets sean seguros (32+ caracteres)

### 2. **JWT Configurable**
   - Default: `JWT_EXPIRES_IN=15m` (en lugar de 7 días)
   - Editable en `.env`

### 3. **Headers de Seguridad (Helmet)**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Automático en todas las respuestas

### 4. **Rate Limiting en Auth**
   - Login: máx 5 intentos cada 15 min por IP
   - Registro: máx 10 cada hora por IP
   - Responde 429 Too Many Requests si se excede

### 5. **Usuarios Sanitizados**
   - `passwordHash` nunca se devuelve en respuestas JSON
   - Solo campos seguros: id, nombre, email, telefono, instagram, etc.

### 6. **CORS Inteligente**
   - Desarrollo: permite localhost:5173, :4200, :3000
   - Producción: permite solo FRONTEND_URL

### 7. **Cloudinary Preparado**
   - Estructura lista para uploads en la nube
   - Deshabilitado por defecto (`CLOUDINARY_ENABLED=false`)

### 8. **.gitignore Expandido**
   - `.env`, `.env.local`, `.env.production` ignorados
   - `*.pem`, `*.key` ignorados (secretos)
   - `dist`, `build`, `logs` ignorados

---

## 🧪 Testing Básico

### Health Check
```bash
curl http://localhost:3000/api/healthz
# Response: {"status":"ok","timestamp":"..."}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nazabarber.com","password":"admin123"}'

# Response: {
#   "token": "eyJ...",
#   "usuario": { id, nombre, email, rol, ... }  ← Sin passwordHash ✅
# }
```

### Rate Limiting (intentar login incorrecto 6 veces rápido)
```bash
# Intentos 1-5: 401 Unauthorized
# Intento 6+: 429 Too Many Requests
```

### Testing automatizado backend (PASO 7)

Se agregó una suite mínima de seguridad con `Jest + Supertest`.

```bash
npm test
```

Casos cubiertos:
- `auth.service`: login inválido (401), respuesta sin `passwordHash`, registro malicioso sin elevación a admin.
- acceso admin: sin token (401), cliente (403), admin (200), token viejo degradado (403).
- `turnos.service`: reserva no disponible (409), cancelación ajena (403).
- validaciones Zod: body con campos extra (`rol`), id inválido, comentario vacío.

Archivos útiles:
- `backend/tests/`
- `backend/QA_CHECKLIST.md`
- `docs/API_TEST_REQUESTS.md`
- `backend/.env.test.example`

---

## 📦 Para Producción: Render + Neon + Cloudinary

**Ver: `PRODUCCION.md`** (en este directorio)

Resumen rápido:
1. Crear base de datos en Neon (PostgreSQL)
2. Crear Web Service en Render
3. Configurar variables de entorno (JWT_SECRET seguro)
4. Render auto-deployará

---

## 🔍 Verificar que Todo está Seguro

### Checklist Local
- [x] `npm install` completa sin errores
- [x] `npm run dev` arranca sin errores
- [x] Login funciona → usuario sin `passwordHash`
- [x] Rate limit funciona → 429 después de 5 intentos
- [x] CORS funciona → frontend puede conectar

### Checklist Producción (Antes de Deployar)
- [ ] JWT_SECRET es valor fuerte (32+ caracteres, aleatorio)
- [ ] DATABASE_URL es de Neon (con sslmode=require)
- [ ] FRONTEND_URL es la URL de Vercel
- [ ] CLOUDINARY_ENABLED está en false (o credenciales configuradas)
- [ ] Migraciones aplicadas en Neon
- [ ] Health check responde OK

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL falta"
**Solución**: Verifica que `.env` tenga `DATABASE_URL` configurado.

```bash
# Verifica que PostgreSQL está corriendo
psql -U postgres -d nazabarber -c "SELECT 1"
```

### Error: "Puerto 3000 ya en uso"
**Solución**: Cambia el puerto o mata el proceso anterior.

```bash
# Cambiar puerto
PORT=3001 npm run dev

# O matar el proceso (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object {Stop-Process -Id $_ -Force}
```

### Error: JWT_SECRET débil (en producción)
**Solución**: Genera un JWT_SECRET fuerte:

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📚 Documentación Completa

| Documento | Contenido |
|-----------|----------|
| **docs/SETUP.md** | Setup local (frontend + backend) |
| **PRODUCCION.md** | Deployment a Render + Neon + Vercel |
| **SECURITY_CHANGES.md** | Detalles de cambios de seguridad (PARTE 1) |
| **VALIDATION.md** | Reglas de validación Zod (PASO 4) |
| **.env.example** | Variables de entorno disponibles |
| **src/config/env.js** | Código de validación de variables |

---

## 📞 Próximos Pasos

### Después de MVP en Producción (PARTE 2)
- [ ] Implementar Refresh Token (cookie httpOnly)
- [ ] Agregar logging centralizado (Sentry, Winston)
- [ ] Tests automáticos (Jest, Cypress)
- [ ] API docs completas (Swagger/OpenAPI)

### Si necesitas Uploads de Imágenes Real
- [ ] Instalar `cloudinary` package
- [ ] Implementar `POST /api/uploads/post` y `POST /api/uploads/profile`
- [ ] Configurar credenciales de Cloudinary en producción

---

## ✅ Resumen

**NazaBarber Backend está ahora:**
- ✅ Seguro (headers, rate limit, sanitización)
- ✅ Validado (variables de entorno requeridas)
- ✅ Listo para producción (documentación completa)
- ✅ Compatible con frontend actual (sin cambios necesarios)

**Status**: 🟢 Listo para development y testing local

---

**¿Preguntas?** Consulta:
- Desarrollo local → **docs/SETUP.md**
- Deployment → **PRODUCCION.md**
- Cambios de seguridad → **SECURITY_CHANGES.md**

---

## PARTE 3: Endpoints Admin Endurecidos

### Flujo de seguridad admin

1. `authMiddleware` valida JWT y responde `401` con `{ "message": "No autenticado" }` si no hay token o es inválido.
2. `adminMiddleware` consulta al usuario real en base de datos y valida:
   - que exista,
   - que no esté deshabilitado/eliminado (si existen campos como `deletedAt`, `active`, `isActive`),
   - que tenga rol `admin` en base de datos.
3. Si no es admin: `403` con `{ "message": "Acceso solo para administradores" }`.

### Rutas admin protegidas

- `GET /api/turnos/admin`
- `GET /api/turnos/admin/metrics`
- `POST /api/turnos/crear`
- `POST /api/turnos/generar-semana`
- `PUT /api/turnos/marcar-cortado/:id`
- `DELETE /api/turnos/:id`
- `GET /api/usuario/clientes`
- `POST /api/redsocial/crear-post`
- `DELETE /api/redsocial/posts/:postId`

Rutas que siguen públicas por diseño:

- `GET /api/turnos/disponibles`
- `POST /api/turnos/anonimo`
- `GET /api/redsocial/posts`
- `GET /api/usuario/admin-publicos`

### Rate limiting admin (moderado)

- `POST /api/turnos/generar-semana`: máximo 5 requests / 15 min.
- `POST /api/redsocial/crear-post`: máximo 20 requests / 15 min.
- `DELETE /api/turnos/:id` y `DELETE /api/redsocial/posts/:postId`: máximo 30 requests / 15 min.

### Datos sensibles nunca expuestos

No devolver en respuestas JSON:

- `password`
- `passwordHash` / `password_hash`
- `resetPasswordToken`
- `resetPasswordExpires`
- `refreshToken` / `refresh_token`
- secretos internos

### Pruebas manuales mínimas recomendadas

Sin token:

- `GET /api/turnos/admin` → `401`
- `POST /api/turnos/crear` → `401`
- `GET /api/usuario/clientes` → `401`

Con token cliente:

- `GET /api/turnos/admin` → `403`
- `POST /api/turnos/crear` → `403`
- `POST /api/redsocial/crear-post` → `403`
- `DELETE /api/redsocial/posts/:id` → `403`

Con token admin:

- `GET /api/turnos/admin` → `200`
- `GET /api/turnos/admin/metrics` → `200`
- `GET /api/usuario/clientes` → `200`
- `POST /api/turnos/crear` → `200/201`
- `POST /api/redsocial/crear-post` → `200/201`
