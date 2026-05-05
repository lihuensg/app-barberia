# 📧 Recuperación de Contraseña con Resend

**Fecha**: 1 de mayo de 2026  
**Status**: ✅ Implementado (backend lista, frontend lista, falta instalar dependencia)

---

## 🎯 Cómo Funciona

### Flujo Local (Desarrollo)

1. Usuario va a http://localhost:5173/recuperar
2. Ingresa email
3. Si email existe: se crea token + se loguea en consola (Resend no configurado)
4. Usuario abre el link desde el log:
   ```
   http://localhost:5173/restablecer/<token>?userId=<userId>
   ```
5. Ingresa nueva contraseña
6. Backend valida token + hashea contraseña nueva
7. Email de confirmación se loguea en consola

### Flujo Producción (Render + Vercel)

1. Usuario va a https://tuapp.vercel.app/recuperar
2. Ingresa email
3. Resend envía email con link:
   ```
   https://tuapp.vercel.app/restablecer/<token>?userId=<userId>
   ```
4. Usuario abre link
5. Ingresa nueva contraseña
6. Backend valida y envía email de confirmación con Resend

---

## 🔧 Setup Requerido

### 1. Generar Migración de Base de Datos

El schema ya tiene el modelo `PasswordResetToken` agregado. Necesitas generar la migración:

```bash
cd backend

# Generar migración (crea tabla password_reset_tokens)
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
```

Esto va a:
- ✅ Crear tabla `password_reset_tokens` en PostgreSQL
- ✅ Crear archivo de migración en `backend/prisma/migrations/`
- ✅ Actualizar Prisma Client generado

### 2. Instalar Dependencia: Resend

```bash
cd backend
npm install resend@^3.0.0
```

O si usas yarn:
```bash
yarn add resend@3.0.0
```

### 3. Configurar Variables de Entorno

#### En Desarrollo Local

Edita `backend/.env`:

```env
# Email - RESEND (Recuperación de contraseña)
RESEND_API_KEY=           # Déjar vacío en desarrollo (usa modo simulado)
MAIL_FROM=NazaBarber <onboarding@resend.dev>

# Ya debe estar:
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

Si RESEND_API_KEY está vacío:
- ✅ Los emails se loguean en consola (modo desarrollo)
- ✅ El backend NO falla
- ✅ Puedes ver el link en los logs

#### En Producción (Render)

1. Ir a https://resend.com/api-keys
2. Crear cuenta (si no tienes)
3. Obtener API Key
4. En Render Dashboard → Environment Variables:

```
RESEND_API_KEY=re_abc123...   # Tu API key real
MAIL_FROM=NazaBarber <no-reply@tudominio.com>
FRONTEND_URL=https://tuapp.vercel.app
BACKEND_URL=https://backend-render-url.onrender.com
```

---

## ✅ Testing Local

### Paso 1: Instalar Resend y generar migración

```bash
cd backend
npm install
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
npm run dev
```

**Output esperado:**
```
✅ Variables de entorno validadas correctamente
✅ Ambiente: DEVELOPMENT
ℹ️  Resend: No configurado (RESEND_API_KEY no está presente)
🧔 NazaBarber API v1.0
Corriendo en puerto 3000
```

### Paso 2: Iniciar frontend

```bash
cd frontend
npm run dev
# http://localhost:5173
```

### Paso 3: Probar recuperación

1. Abre http://localhost:5173/recuperar
2. Ingresa: `admin@nazabarber.com`
3. Haz clic "Enviar instrucciones"
4. Revisa logs del backend (verás el link)
5. Copia el link que genera algo como:
   ```
   http://localhost:5173/restablecer/abc123...?userId=1
   ```
6. Abre ese link en el navegador
7. Ingresa nueva contraseña
8. Haz clic "Guardar contraseña"
9. Deberías ser redirigido a login
10. Prueba login con new password

### Paso 4: Verificar Backend (curl)

```bash
# 1. Solicitar reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nazabarber.com"}'

# Response: 
# {
#   "message": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña."
# }

# (Revisar logs del backend para ver el token generado)
```

---

## 📱 Endpoints Backend

### POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "admin@nazabarber.com"
}
```

**Response (siempre igual, no revela si email existe):**
```json
{
  "message": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña."
}
```

**Rate limiting:** 3 intentos cada 30 minutos por IP

**Lo que hace:**
- ✅ Busca usuario por email (silenciosamente si no existe)
- ✅ Genera token aleatorio (64 caracteres hex)
- ✅ Hashea token con SHA256 antes de guardar en DB
- ✅ Token expira en 60 minutos
- ✅ Envía email con link (o loguea en consola si Resend no configurado)

### POST /api/auth/reset-password

**Request:**
```json
{
  "userId": 1,
  "token": "abc123...",
  "newPassword": "nuevacontraseña123"
}
```

**Response:**
```json
{
  "message": "Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña."
}
```

**Status codes:**
- `200 OK` — Contraseña actualizada
- `400 Bad Request` — Falta token, userId, o password <6 caracteres
- `401 Unauthorized` — Token inválido, expirado, o ya usado
- `500 Internal Server Error` — Error del servidor

**Lo que hace:**
- ✅ Valida token + userId + expiración
- ✅ Si token ya fue usado: rechaza
- ✅ Si token expirado: rechaza
- ✅ Si válido: hashea nueva password, guarda en DB
- ✅ Marca token como usado (no se puede reutilizar)
- ✅ Envía email de confirmación

---

## 🔒 Seguridad

### ✅ Implementado

1. **Token seguro:**
   - Generado con `crypto.randomBytes(32)` (256 bits)
   - Nunca almacenado en plain text en DB
   - Se guarda hasheado (SHA256)

2. **Token de un solo uso:**
   - Se marca `usedAt` después de usar
   - No puede ser reutilizado
   - Intento de reutilizar: rechazo

3. **Token con expiración:**
   - Expira en 60 minutos por defecto
   - Frontend valida en resend página
   - Backend rechaza tokens expirados

4. **Email no revelado:**
   - `POST /api/auth/forgot-password` SIEMPRE responde igual
   - No se revela si email existe o no
   - Protege contra enumeration de usuarios

5. **Contraseña hasheada:**
   - Nueva contraseña hasheada con bcrypt (salt: 10)
   - Nunca almacenada en plain text

6. **Rate limiting:**
   - `/api/auth/forgot-password`: 3 intentos/30 min/IP
   - Previene ataques de fuerza bruta

---

## 📧 Variables de Email

La tabla `password_reset_tokens` tiene estos campos:

```
id                Int     @id @default(autoincrement())
usuarioId         Int     (relación a usuario)
tokenHash         String  (token hasheado con SHA256)
expiresAt         DateTime (cuándo expira)
usedAt            DateTime? (NULL si no usado, fecha si usado)
createdAt         DateTime (cuándo fue creado)
```

---

## 🐛 Troubleshooting

### Error: "Table password_reset_tokens does not exist"

**Causa:** No generaste la migración.

**Solución:**
```bash
cd backend
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
```

### Error: "Resend not found"

**Causa:** No instalaste Resend.

**Solución:**
```bash
cd backend
npm install resend
```

### El email no se envía en local pero tampoco se loguea

**Causa:** Probablemente error en email.service.js.

**Solución:** 
- Revisa logs del backend
- Si RESEND_API_KEY está vacío, debería decir:
  ```
  📧 [DEV MODE] Email de recuperación (no enviado):
  ```

### Token está vacío o es `undefined`

**Causa:** El hash está mal generado o hay error.

**Solución:**
- Revisa que `crypto` esté importado en passwordResetToken.repository.js
- Revisa logs del backend

### "Token inválido" aunque acabo de generar

**Causa:** Token no matchea o fue modificado.

**Solución:**
- Copia el token EXACTO del log
- No lo modifiques
- Si lo copias mal: va a ser diferente hash

---

## 🚀 Deployment a Render

### Paso 1: Agregar Resend API Key

1. Ir a https://resend.com/api-keys
2. Copiar tu API Key
3. En Render → Environment Variables:
   ```
   RESEND_API_KEY=re_abc123...
   MAIL_FROM=NazaBarber <no-reply@tudominio.com>
   ```

### Paso 2: Deploy

Cuando pushes a `main`, Render:
- ✅ Instala `resend` (porque está en package.json)
- ✅ Ejecuta `npm start`
- ✅ Lee RESEND_API_KEY de variables
- ✅ Envía emails reales con Resend

---

## 📖 Próximos Pasos

- [ ] Configurar dominio real en Resend (en lugar de onboarding@)
- [ ] Agregar "Resend nuevamente" rate-limited
- [ ] Agregar verificación de 2FA con email
- [ ] Agregar logs de intentos de reset fallidos
- [ ] Agregar purga automática de tokens expirados

---

**Status**: ✅ Ready for testing

- Backend: implementado
- Frontend: listo (ya existía)
- Database: esquema agregado
- Emails: listo (Resend o consola)

**Próximo paso**: `npm install` + migración + testing
