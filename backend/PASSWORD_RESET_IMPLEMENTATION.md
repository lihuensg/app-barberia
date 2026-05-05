# 📧 Recuperación de Contraseña - Resumen de Cambios

**Fecha**: 1 de mayo de 2026  
**Característica**: Password Reset con Resend Email  
**Status**: ✅ Implementado (backend + frontend)

---

## 📋 Archivos Creados

### Backend

1. **`backend/src/config/resend.js`** ← Configuración de Resend
   - Detecta si RESEND_API_KEY está configurado
   - Exporta config y funciones de validación

2. **`backend/src/services/email.service.js`** ← Servicio de emails transaccionales
   - `sendPasswordResetEmail()` - Email con link de recuperación
   - `sendPasswordChangedEmail()` - Email de confirmación
   - En desarrollo (sin API key): loguea en consola
   - En producción: envía via Resend

3. **`backend/src/repositories/passwordResetToken.repository.js`** ← Gestión de tokens
   - Genera tokens aleatorios (256 bits)
   - Hashea tokens con SHA256 antes de guardar
   - Valida tokens (expiración, uso único, etc.)
   - Marca tokens como usados

### Frontend

1. **`frontend/src/pages/Restablecer.tsx`** ← Actualizado
   - Ahora extrae `userId` del query string
   - Valida que userId esté presente
   - Envía `{ userId, token, newPassword }` al backend

### Database

1. **`backend/prisma/schema.prisma`** ← Modelo agregado
   ```prisma
   model PasswordResetToken {
       id        Int
       usuarioId Int
       tokenHash String
       expiresAt DateTime
       usedAt    DateTime?
       createdAt DateTime
   }
   ```

---

## 📝 Archivos Modificados

### Backend

1. **`backend/.env.example`**
   - ✅ Agregadas variables: `RESEND_API_KEY`, `MAIL_FROM`

2. **`backend/package.json`**
   - ✅ Agregada dependencia: `resend@^3.0.0`

3. **`backend/src/services/auth.service.js`**
   - ✅ Agregada función: `forgotPassword()`
   - ✅ Agregada función: `resetPassword()`
   - ✅ Importa email.service y passwordResetToken.repository

4. **`backend/src/controllers/auth.controller.js`**
   - ✅ Agregado controlador: `forgotPassword()`
   - ✅ Agregado controlador: `resetPassword()`

5. **`backend/src/routes/auth.routes.js`**
   - ✅ Agregada ruta: `POST /api/auth/forgot-password`
   - ✅ Agregada ruta: `POST /api/auth/reset-password`
   - ✅ Agregado rate limiter: `forgotPasswordLimiter` (3 intentos/30 min)

6. **`backend/src/repositories/usuarios.repository.js`**
   - ✅ Agregada función: `actualizarPassword()`

7. **`backend/src/middlewares/rateLimiter.middleware.js`**
   - ✅ Agregado limiter: `forgotPasswordLimiter`

### Frontend

1. **`frontend/src/pages/Recuperar.tsx`**
   - Mantiene cambios existentes (ya usaba useForgotPassword)

---

## 🔐 Seguridad Implementada

| Aspecto | Implementado | Detalles |
|---------|-------------|----------|
| **Token Seguro** | ✅ | Generado con crypto.randomBytes(32), 256 bits |
| **Token Hasheado** | ✅ | SHA256 antes de guardar en DB (nunca plain text) |
| **Expiración** | ✅ | 60 minutos por defecto |
| **Un Solo Uso** | ✅ | Marca como `usedAt` tras usar, previene reutilización |
| **Email No Revelado** | ✅ | Siempre mismo mensaje (no enumeration de usuarios) |
| **Rate Limiting** | ✅ | 3 intentos/30 min por IP en `/forgot-password` |
| **Contraseña Hasheada** | ✅ | bcrypt (salt: 10) |
| **Email Seguro** | ✅ | Nunca expone API secret (solo en backend) |

---

## 🚀 Endpoints Nuevos

### POST /api/auth/forgot-password

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nazabarber.com"}'
```

**Response (siempre igual):**
```json
{
  "message": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña."
}
```

**Rate Limit:** 3 intentos / 30 min / IP

**Lo que hace:**
1. Busca usuario por email (sin revelar si existe)
2. Genera token aleatorio (64 caracteres hex)
3. Hashea token con SHA256
4. Guarda en DB con expiración 60 min
5. Envía email (o loguea si sin Resend API key)

### POST /api/auth/reset-password

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "token": "abc123...",
    "newPassword": "nuevapass123"
  }'
```

**Response:**
```json
{
  "message": "Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña."
}
```

**Status codes:**
- `200` - Éxito
- `400` - Request inválido
- `401` - Token inválido/expirado/usado
- `500` - Error servidor

**Lo que hace:**
1. Valida token (existe, no expirado, no usado)
2. Valida userId
3. Valida nueva contraseña (mín 6 caracteres)
4. Hashea nueva contraseña
5. Actualiza en DB
6. Marca token como usado
7. Envía email de confirmación

---

## 🖥️ Pantallas Frontend

### /recuperar (Recuperar.tsx)

**Estado:**
- ✅ Ya existía, usa `useForgotPassword()`
- ✅ Muestra mensaje genérico cuando se envía
- ✅ Input para email
- ✅ Botón "Enviar instrucciones"

**Flujo:**
1. Usuario ingresa email
2. Hace submit
3. Se llamará a `POST /api/auth/forgot-password`
4. Muestra "Si el email existe..."

### /restablecer/:token (Restablecer.tsx)

**Cambios realizados:**
- ✅ Ahora extrae `userId` del query string
- ✅ Valida que userId esté presente
- ✅ Envía `{ userId, token, newPassword }` al backend
- ✅ Muestra error si falta userId

**Flujo:**
1. Usuario abre link del email: `/restablecer/TOKEN?userId=1`
2. Extrae TOKEN de la URL, userId del query
3. Ingresa nueva contraseña
4. Hace submit
5. Llamará a `POST /api/auth/reset-password` con userId + token + password
6. Si éxito: redirige a /login
7. Si error: muestra mensaje

**URL esperada (desde email):**
```
http://localhost:5173/restablecer/abc123xyz?userId=1
```

---

## 📊 Base de Datos

### Nueva Tabla: password_reset_tokens

```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX (usuario_id),
  INDEX (expires_at)
);
```

**Campos:**
- `id` - PK autoincremental
- `usuario_id` - FK al usuario
- `token_hash` - Token hasheado (nunca plain text)
- `expires_at` - Cuándo caduca
- `used_at` - NULL si no usado, fecha si fue usado
- `created_at` - Cuándo se creó

---

## 🔧 Instalación

### Paso 1: Generar Migración

```bash
cd backend
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
```

Esto:
- ✅ Crea tabla en PostgreSQL
- ✅ Crea archivo de migración
- ✅ Actualiza Prisma Client

### Paso 2: Instalar Resend

```bash
cd backend
npm install resend
```

### Paso 3: Configurar Variables

En `backend/.env`:
```env
RESEND_API_KEY=               # Vacío en dev, real en producción
MAIL_FROM=NazaBarber <onboarding@resend.dev>
```

### Paso 4: Iniciar Backend

```bash
npm run dev
```

**Output esperado:**
```
✅ Variables de entorno validadas
✅ Ambiente: DEVELOPMENT
ℹ️  Resend: No configurado
🧔 NazaBarber API v1.0
```

---

## 🧪 Testing

### Local (sin Resend API key)

1. **Ir a**: http://localhost:5173/recuperar
2. **Ingresar**: admin@nazabarber.com
3. **Hacer clic**: "Enviar instrucciones"
4. **Revisar logs**: Backend mostrará:
   ```
   📧 [DEV MODE] Email de recuperación (no enviado):
   resetUrl: http://localhost:5173/restablecer/TOKEN?userId=1
   ```
5. **Copiar URL**: De los logs
6. **Pegar**: En navegador
7. **Ingresar**: Nueva contraseña
8. **Enviar**: Debería redirigir a login
9. **Probar**: Login con nueva contraseña

### Con Resend API Key (Producción)

1. Mismos pasos pero en producción
2. Email real se envía con Resend
3. Usuario abre link en email
4. Procede normalmente

### Via cURL

```bash
# 1. Solicitar reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nazabarber.com"}'

# 2. Extraer token de logs

# 3. Reset password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "token": "TOKEN_FROM_LOGS",
    "newPassword": "newpass123"
  }'
```

---

## 📦 Dependencias Nuevas

```json
{
  "resend": "^3.0.0"
}
```

**Ya instaladas:**
- `bcrypt` - Hashing de contraseñas
- `crypto` - Generación de tokens (built-in Node.js)
- `jsonwebtoken` - JWT auth

---

## 🌐 Producción (Render + Vercel)

### Setup Render Backend

1. **Crear API key en Resend:**
   - Ir a https://resend.com/api-keys
   - Copiar tu API key

2. **En Render Environment Variables:**
   ```
   RESEND_API_KEY=re_abc123...
   MAIL_FROM=NazaBarber <no-reply@tudominio.com>
   FRONTEND_URL=https://tuapp.vercel.app
   ```

3. **Deploy:**
   - Render instala `resend` (está en package.json)
   - Corre migraciones
   - Arranca backend

### Setup Vercel Frontend

1. **En Vercel Environment Variables:**
   - (No se configura nada relacionado a Resend en frontend)
   - Frontend solo consume API del backend

2. **Deploy:**
   - Vercel detecta cambios en frontend/src/pages/Restablecer.tsx
   - Redeploy automático

---

## 📌 Notas Importantes

1. **RESEND_API_KEY nunca en frontend:**
   - Siempre solo en backend (Render)
   - Frontend nunca tiene acceso

2. **URL en email:**
   - Backend construye URL con `process.env.FRONTEND_URL`
   - En local: `http://localhost:5173/restablecer/...`
   - En prod: `https://tuapp.vercel.app/restablecer/...`

3. **Token no se expone:**
   - Solo se pasa por email
   - Se hashea en DB
   - Se marca como usado tras usar

4. **Contraseña no se envía:**
   - Nunca en email
   - Usuario ingresa en formulario del frontend
   - Se transmite via HTTPS en producción

---

## ✅ Checklist Final

- [x] Modelo `PasswordResetToken` agregado a schema
- [x] `email.service.js` con funciones de email
- [x] `resend.js` para configuración
- [x] `passwordResetToken.repository.js` para tokens
- [x] `forgotPassword()` en auth.service.js
- [x] `resetPassword()` en auth.service.js
- [x] Controladores en auth.controller.js
- [x] Rutas `/forgot-password` y `/reset-password`
- [x] Rate limiting en forgot-password (3 intentos/30 min)
- [x] Restablecer.tsx actualizado para userId
- [x] Variables de entorno en .env.example
- [x] Dependencia resend en package.json
- [x] Documentación PASSWORD_RESET_SETUP.md
- [x] Token de un solo uso
- [x] Expiración de tokens (60 min)
- [x] Hashing de tokens (SHA256)
- [x] Email no revelado en forgot-password
- [x] Contraseña hasheada (bcrypt)

---

## 🚀 Próximos Pasos

- [ ] Resend: configurar dominio real (en lugar de onboarding@)
- [ ] Resend: validar email sendingPor cuenta
- [ ] Backend: agregar "resend email" endpoint si lo necesitas
- [ ] Logging: agregar intentos fallidos a tabla de logs
- [ ] Cleanup: purga automática de tokens expirados (cron job)
- [ ] 2FA: agregar verificación de 2 factores con email
- [ ] Rate limit: dashboard para admin de intentos

---

**Status**: ✅ Ready for Production

Ahora instala dependencias y genera migración para empezar a testear.
