# 🚀 Recuperación de Contraseña - Guía Rápida de Inicio

**⏱️ Tiempo total**: ~5 minutos para setup local

---

## 📋 Qué se implementó

✅ **Backend completo** con Resend email  
✅ **Frontend completo** (Recuperar.tsx y Restablecer.tsx)  
✅ **Base de datos** con modelo PasswordResetToken  
✅ **Rate limiting** y **seguridad** implementada  
✅ Listo para **local + producción**

---

## 🔧 Setup en 3 Pasos

### 1️⃣ Generar Migración (30 segundos)

```bash
cd backend

# Crear tabla en PostgreSQL
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
```

**Output esperado:**
```
✔ Created migration from schema changes (migrations/xxx_add_password_reset_tokens)
✔ Generated Prisma Client
```

### 2️⃣ Instalar Resend (10 segundos)

```bash
npm install
```

**Output esperado:**
```
added 1 package (resend@3.0.0)
```

### 3️⃣ Iniciar Backend (10 segundos)

```bash
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

---

## ✅ Testing Local (2 minutos)

### Paso 1: Ir a recuperación

```
http://localhost:5173/recuperar
```

### Paso 2: Ingresar email

Escribe: `admin@nazabarber.com`

### Paso 3: Ver instrucciones

1. Haz clic "Enviar instrucciones"
2. Revisa **console del backend** (logs)
3. Deberías ver algo como:

```
📧 [DEV MODE] Email de recuperación (no enviado):
  Para: admin@nazabarber.com
  resetUrl: http://localhost:5173/restablecer/abc123xyz?userId=1
```

### Paso 4: Copiar y abrir link

Copia el link completo (`http://localhost:5173/restablecer/...?userId=1`) y ábrelo en el navegador.

### Paso 5: Restablecer contraseña

1. Ingresa nueva contraseña (mín 6 caracteres)
2. Confirma contraseña
3. Haz clic "Guardar contraseña"
4. Deberías ser redirigido a login

### Paso 6: Probar login

Usa la nueva contraseña para ingresar. ✅ Listo!

---

## 🌐 Testing con cURL (opcional)

```bash
# 1. Solicitar reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nazabarber.com"}'

# Response:
# {"message":"Si el email existe en nuestro sistema..."}

# 2. Copiar token de logs del backend y usar:
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "token": "TOKEN_DE_LOS_LOGS",
    "newPassword": "nuevapass123"
  }'

# Response:
# {"message":"Tu contraseña ha sido actualizada..."}
```

---

## 📧 Variables de Entorno

### Local (Ya configurado)

`backend/.env` ya tiene:

```env
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=           # Vacío (uso modo consola)
MAIL_FROM=NazaBarber <onboarding@resend.dev>
```

No necesitas cambiar nada. ✅

### Producción (Para después)

Cuando deployes en Render, agregarás:

```env
RESEND_API_KEY=re_abc123...        # De https://resend.com/api-keys
MAIL_FROM=NazaBarber <noreply@tudominio.com>
```

Ver [PRODUCCION.md](PRODUCCION.md) para detalles.

---

## 📱 Endpoints

| Endpoint | Method | Función |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Solicita email de recuperación |
| `/api/auth/reset-password` | POST | Completa cambio de contraseña |

### Request/Response

**Forgot Password:**
```json
// Request
POST /api/auth/forgot-password
{"email":"admin@nazabarber.com"}

// Response (siempre igual)
{"message":"Si el email existe en nuestro sistema, recibirás instrucciones..."}
```

**Reset Password:**
```json
// Request
POST /api/auth/reset-password
{
  "userId": 1,
  "token": "abc123xyz",
  "newPassword": "newpass123"
}

// Response
{"message":"Tu contraseña ha sido actualizada..."}
```

---

## 🔒 Seguridad Implementada

| Aspecto | Status |
|---------|--------|
| Token de 64 caracteres aleatorios | ✅ |
| Token hasheado en BD (nunca plain text) | ✅ |
| Token expira en 60 minutos | ✅ |
| Token de un solo uso (previene reutilización) | ✅ |
| Email no revelado (no enumeration) | ✅ |
| Rate limiting (3 intentos/30 min) | ✅ |
| Contraseña hasheada con bcrypt | ✅ |
| Resend API key solo en backend | ✅ |

---

## 📂 Archivos Creados/Modificados

### Creados

```
backend/src/config/resend.js
backend/src/services/email.service.js
backend/src/repositories/passwordResetToken.repository.js
backend/PASSWORD_RESET_SETUP.md
backend/PASSWORD_RESET_IMPLEMENTATION.md
```

### Modificados

```
backend/prisma/schema.prisma (modelo PasswordResetToken)
backend/.env.example (RESEND_API_KEY, MAIL_FROM)
backend/package.json (resend@^3.0.0)
backend/src/services/auth.service.js (forgotPassword, resetPassword)
backend/src/controllers/auth.controller.js (controladores nuevos)
backend/src/routes/auth.routes.js (rutas nuevas + rate limiting)
backend/src/repositories/usuarios.repository.js (actualizarPassword)
backend/PRODUCCION.md (sección Resend)
frontend/src/pages/Restablecer.tsx (ahora extrae userId del query)
```

---

## 🐛 Si Algo Falla

### Error: "Table password_reset_tokens does not exist"

```bash
cd backend
npx prisma migrate dev --name add_password_reset_tokens --schema=prisma/schema.prisma
```

### Error: "Resend module not found"

```bash
cd backend
npm install
```

### El email no se muestra en logs

Revisa que el backend esté corriendo y que veas el output de migración.

### Token inválido después de generar

El token es sensible a mayúsculas/minúsculas. Cópialo exactamente de los logs.

---

## 🚀 Próximo Paso: Producción

Cuando estés listo para producción:

1. **Lee**: [PRODUCCION.md](PRODUCCION.md)
2. **Obtén**: API key en https://resend.com/api-keys
3. **Configura**: En Render environment variables
4. **Deploy**: Push a main

---

## 📚 Documentación Completa

- [PASSWORD_RESET_SETUP.md](PASSWORD_RESET_SETUP.md) - Setup detallado
- [PASSWORD_RESET_IMPLEMENTATION.md](PASSWORD_RESET_IMPLEMENTATION.md) - Cambios de código
- [PRODUCCION.md](PRODUCCION.md) - Deploy en producción
- [SECURITY_CHANGES.md](SECURITY_CHANGES.md) - Seguridad (actualizar después)

---

**Status**: ✅ Ready to Use

Sigue los 3 pasos de setup y estará todo funcionando en tu máquina.

¡Próximo?

- Hacer testing completo
- Configurar producción cuando estés listo
- Considerar agregar logs de intentos fallidos

---

**Problemas?** Revisar los documentos `.md` anteriores o revisar los logs del backend.
