# CAMBIOS DE SEGURIDAD - PARTE 1

**Fecha**: 1 de mayo de 2026  
**Status**: ✅ Implementado y testeado localmente

---

## Resumen de Cambios

Se aplicó la **PARTE 1 de seguridad** al backend de NazaBarber. Todos los cambios fueron diseñados para **no romper** la integración con el frontend.

---

## 1. Variables de Entorno Seguras

### Archivos Creados/Modificados

**backend/.env.example** (CREADO)
- Archivo de ejemplo con todas las variables necesarias
- Valores ficticios claramente marcados
- Secciones: Database, JWT, Server, Cloudinary, Log
- Orientado para desarrollo local y producción

**backend/src/config/env.js** (CREADO)
- Validación centralizada de variables de entorno
- Ejecutarse automáticamente al iniciar el servidor
- Validaciones específicas por ambiente

**Validaciones implementadas:**
- ✅ Variables críticas (DATABASE_URL, JWT_SECRET, FRONTEND_URL) son obligatorias
- ✅ En producción: JWT_SECRET mínimo 32 caracteres
- ✅ En producción: JWT_SECRET no puede ser valor débil
- ✅ Cloudinary validado si CLOUDINARY_ENABLED=true
- ✅ Si faltan variables críticas: servidor no arranca (error claro)

### Impacto en Frontend
**Ninguno**. El frontend no cambió.

---

## 2. JWT Más Seguro y Configurable

### Archivo Modificado
**backend/src/services/auth.service.js**

**Cambio específico:**
```javascript
// ANTES
{ expiresIn: '7d' }

// DESPUÉS
{ expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
```

**Nuevo valor por defecto**: 15 minutos (en lugar de 7 días)

### Variables de Entorno
```
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d (preparado para futura implementación)
```

### Test Realizado
✅ POST /api/auth/login devuelve token válido con exp = ahora + 15 min

### Impacto en Frontend
**Mínimo**. El token sigue siendo JWT válido y se procesa igual. El frontend captura error 401 cuando expira (comportamiento existente).

---

## 3. Protección de Secretos y .gitignore

### Archivo Modificado
**backend/.gitignore**

**Cambios:**
- Ampliado de 3 líneas a 40+ líneas
- Incluye:
  - .env, .env.local, .env.production, .env.development
  - *.pem, *.key, *.crt, *.cert
  - dist/, build/, .next/, /src/generated/prisma
  - logs/, coverage/, .vercel/, .render/

### Impacto
Garantiza que secretos no se commiteen a Git.

---

## 4. Headers de Seguridad con Helmet

### Dependencia Instalada
```bash
npm install helmet@^7.1.0
npm install express-rate-limit@^7.1.5
```

### Archivo Modificado
**backend/src/server.js**

**Headers agregados:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (en producción)
- X-Powered-By deshabilitado

### Test Realizado
✅ GET /api/healthz devuelve headers de seguridad correcto

### Impacto en Frontend
**Ninguno**. Headers transparentes para el cliente.

---

## 5. CORS Preparado para Local y Producción

### Archivo Modificado
**backend/src/server.js**

**Lógica nueva:**
```javascript
if (NODE_ENV === 'production') {
    // Solo FRONTEND_URL permitido
} else {
    // localhost:5173, :4200, :3000 permitidos
}
```

**Test realizado:**
✅ CORS funciona con frontend en localhost
✅ Requests sin origin permitidas (Postman)

### Impacto en Frontend
**Ninguno**. CORS ya estaba permitiendo localhost.

---

## 6. Rate Limiting en Auth

### Archivo Creado
**backend/src/middlewares/rateLimiter.middleware.js**

**Limitadores configurados:**
- Login: máximo 5 intentos cada 15 minutos por IP
- Registro: máximo 10 intentos cada hora por IP
- Forgot password: máximo 3 intentos cada 30 minutos por IP

### Archivo Modificado
**backend/src/routes/auth.routes.js**

**Cambio:**
```javascript
// ANTES
router.post('/login', authController.login);

// DESPUÉS
router.post('/login', loginLimiter, authController.login);
```

### Test Realizado
✅ 5 intentos de login fallidos: 401  
✅ 6to intento: 429 Too Many Requests  
✅ Mensaje de error genérico y seguro  

### Impacto en Frontend
**Mínimo**. El frontend ya maneja errores 401 y 429.

---

## 7. Sanitización de Respuestas (No Exponer passwordHash)

### Archivo Creado
**backend/src/utils/sanitize.js**

**Funciones:**
- `sanitizeUser()` - Remover passwordHash
- `sanitizeUsers()` - Array de usuarios
- `sanitizeTurno()` - Turno con usuario sanitizado
- `sanitizePost()` - Post con usuarios sanitizados

**Campos seguros que se devuelven:**
```
id, nombre, email, telefono, instagram, whatsapp, bio, foto, rol, createdAt, updatedAt
```

**Campos NUNCA devueltos:**
```
passwordHash (o password, password_hash)
```

### Archivos Modificados
**backend/src/services/usuario.service.js**
- `getMe()` ahora devuelve usuario sanitizado
- `updateMe()` devuelve usuario sanitizado
- `subirFoto()` devuelve usuario sanitizado
- `getAdminPublico()` devuelve usuario sanitizado
- `getClientes()` devuelve array de usuarios sanitizados

### Test Realizado
✅ POST /api/auth/login: usuario sin passwordHash ✅ GET /api/usuario/me: usuario sin passwordHash  
✅ GET /api/usuario/clientes: clientes sin passwordHash

### Impacto en Frontend
**Ninguno**. El frontend ya no usaba passwordHash de las respuestas.

---

## 8. Cloudinary Preparado (Sin Implementar Todavía)

### Archivo Creado
**backend/src/config/cloudinary.js**

**Estado:**
- Estructura lista para implementar uploads en Cloudinary
- En desarrollo local: deshabilitado (CLOUDINARY_ENABLED=false)
- En producción: se puede habilitar agregando credenciales

**Variables de entorno:**
```
CLOUDINARY_ENABLED=false
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=nazabarber
```

### Impacto en Frontend
**Ninguno**. Cloudinary todavía no está en uso. Los uploads de imágenes siguen funcionando igual (data-URLs por ahora).

---

## 9. Documentación para Producción

### Archivo Creado
**backend/PRODUCCION.md**

**Contenido:**
- Setup paso a paso para Render
- Setup para base de datos Neon
- Setup para Cloudinary
- Setup para Vercel frontend
- Variables de entorno para cada ambiente
- Migraciones y seed
- Testing post-deploy
- Troubleshooting
- Rollback procedures
- Checklist final

---

## 10. Mejorado Logging y Errores

### Archivo Modificado
**backend/src/server.js**

**Mejoras:**
- Banner ASCII al iniciar (muestra ambiente, puerto, etc.)
- Logging diferenciado por ambiente:
  - Desarrollo: full stack traces
  - Producción: mensajes genéricos sin detalles
- Validación de env al iniciar (o falla con error claro)

**Ejemplo de arranque:**
```
✅ Variables de entorno validadas correctamente
✅ Ambiente: DEVELOPMENT
ℹ️ Cloudinary deshabilitado
🧔 NazaBarber API v1.0
Corriendo en puerto 3000
```

---

## 11. Compatibilidad con Frontend

### Status: ✅ 100% Compatible

El frontend **NO NECESITA CAMBIOS** porque:

1. **Token sigue siendo JWT válido**: mismo formato, mismo proceso
2. **Login sigue igual**: POST /api/auth/login → devuelve token + usuario
3. **GET /api/usuario/me sigue igual**: devuelve usuario con mismos campos
4. **Turnos, posts, comentarios**: respuestas JSON idénticas
5. **Errores**: Frontend ya maneja 401, 429, etc.

Pruebas locales:
✅ Frontend arranca en http://localhost:5174
✅ Puede conectar a backend en http://localhost:3000
✅ CORS permite comunicación
✅ Login funciona
✅ Pantalla de inicio carga

---

## 12. Testing Realizado

### Pruebas de Backend
```bash
# Health check
GET /api/healthz
Response: {"status":"ok","timestamp":"..."}

# Login correcto
POST /api/auth/login (admin@nazabarber.com / admin123)
Response: {token: "...", usuario: {...}} 
Nota: usuario NO incluye passwordHash ✅

# Login incorrecto (5+ intentos)
5x POST /api/auth/login (wrong password)
Response 401: {"message":"Credenciales inválidas"}
6x POST /api/auth/login
Response 429: Too Many Requests

# Usuario autenticado
GET /api/usuario/me (con token)
Response: usuario sanitizado ✅

# Clientes (admin)
GET /api/usuario/clientes (con token admin)
Response: array de usuarios sin passwordHash ✅
```

### Pruebas de Frontend
✅ npm install completado
✅ npm run dev arrancó correctamente
✅ Frontend carga en http://localhost:5174
✅ Conecta con backend (CORS OK)

---

## 13. Instalación/Deployment

### Instalación Local

```bash
# Backend
cd backend
npm install  # Instala helmet + express-rate-limit
npm run dev  # Arranca con validación de env

# Frontend (en otra terminal)
cd frontend
npm run dev  # Arranca en http://localhost:5174
```

### Deployment en Producción (Render)

Ver **backend/PRODUCCION.md** para instrucciones completas. Principalmente:

1. Crear proyecto en Render
2. Configurar variables de entorno (JWT_SECRET seguro de 32+ caracteres)
3. Desplegar

Render ejecutará automáticamente:
- `npm install`
- `npx prisma generate`
- `npm start` (o `npm run dev`)

---

## 14. Próximos Pasos (Futuro)

### Parte 2 (Recomendado después de MVP en producción)
- [ ] Implementar Refresh Token
- [ ] Agregar logging centralizado (Sentry, Winston)
- [ ] Tests automáticos (Jest, E2E Cypress)
- [ ] Monitoring y alertas
- [ ] OWASP security headers adicionales

### Implementar Cloudinary (si se requiere upload real)
- [ ] npm install cloudinary
- [ ] Implementar endpoints POST /api/uploads/post y profile
- [ ] Integración en frontend

### Escalabilidad
- [ ] Redis para caché de sesiones
- [ ] Read replicas en base de datos
- [ ] CDN para archivos estáticos

---

## Checklist Final

- [x] Variables de entorno validadas al iniciar
- [x] JWT con expiración configurable (15m por defecto)
- [x] Helmet instalado y activo
- [x] x-powered-by deshabilitado
- [x] Rate limiting en auth endpoints
- [x] Usuarios sanitizados (sin passwordHash)
- [x] CORS preparado para local y producción
- [x] Cloudinary preparado (deshabilitado en local)
- [x] .gitignore expandido (no commitea .env, secrets, etc.)
- [x] Documentación de producción completa
- [x] Logging mejorado
- [x] Tests básicos pasados
- [x] Frontend compatible (sin cambios)
- [x] Backend arranca sin errores
- [x] Mensaje de error no revela detalles internos

---

## Resumen de Seguridad Aplicado

| Cambio | Status | Impacto Frontend |
|--------|--------|-----------------|
| Variables de entorno validadas | ✅ | Ninguno |
| JWT configurable (15m) | ✅ | Ninguno |
| Helmet headers | ✅ | Ninguno |
| Rate limiting | ✅ | Maneja 429 OK |
| Sanitización de usuarios | ✅ | Ninguno |
| CORS mejorado | ✅ | Ninguno |
| Cloudinary preparado | ✅ | Ninguno |
| .gitignore expandido | ✅ | N/A |
| Logging mejorado | ✅ | Ninguno |
| Documentación de producción | ✅ | N/A |

**RESULTADO**: Backend más seguro, listo para producción, frontend compatible 100%.

---

## PARTE 3: Hardening de Endpoints Admin

**Fecha**: 2 de mayo de 2026

### 1. `authMiddleware` y `adminMiddleware` separados y reforzados

- `authMiddleware` ahora responde `401` con `No autenticado` cuando no hay token o el JWT es inválido.
- `adminMiddleware` no confía en el rol del JWT:
  - exige `req.usuario` válido,
  - consulta el usuario real en base de datos,
  - devuelve `401` si el usuario no existe,
  - valida estado deshabilitado/eliminado si hay campos (`deletedAt`, `active`, `isActive`),
  - devuelve `403` si el rol real no es `admin`.

### 2. Endpoints admin protegidos

Confirmadas rutas con `authMiddleware + adminMiddleware`:

- `GET /api/turnos/admin`
- `GET /api/turnos/admin/metrics`
- `POST /api/turnos/crear`
- `POST /api/turnos/generar-semana`
- `PUT /api/turnos/marcar-cortado/:id`
- `DELETE /api/turnos/:id`
- `GET /api/usuario/clientes`
- `POST /api/redsocial/crear-post`
- `DELETE /api/redsocial/posts/:postId`

### 3. Validaciones críticas en operaciones admin

- `PUT /api/turnos/marcar-cortado/:id`:
  - `404` si no existe.
  - `400` si el estado no es `reservado`.
- `DELETE /api/turnos/:id`:
  - `404` si no existe.
  - `409` si está en estado `cancelado` o `cortado`.
- `POST /api/turnos/generar-semana`:
  - valida formato de horas,
  - valida `horaFin > horaInicio`,
  - valida `intervaloMinutos >= 15`,
  - valida `diasIncluidos` entre `0..6`,
  - limita `cantidadDias` entre 1 y 31,
  - evita duplicados devolviendo conteo de `creados` y `omitidos`.

### 4. Rate limit moderado en acciones admin

- `generar-semana`: 5 requests / 15 min.
- `crear-post`: 20 requests / 15 min.
- eliminaciones (`turnos` y `posts`): 30 requests / 15 min.

### 5. Logs de acciones admin

Se agregó helper `src/utils/adminAudit.js` para trazas no bloqueantes en desarrollo.

Acciones registradas:

- `ADMIN_LOGIN`
- `ADMIN_CREO_TURNO`
- `ADMIN_GENERO_TURNOS`
- `ADMIN_MARCO_CORTADO`
- `ADMIN_ELIMINO_TURNO`
- `ADMIN_CREO_POST`
- `ADMIN_ELIMINO_POST`
- `ADMIN_LISTO_CLIENTES`

### 6. Pruebas esperadas

- Sin token en rutas admin: `401`.
- Token de cliente en rutas admin: `403`.
- Token de admin válido en BD: `200/201`.
- Token válido pero usuario eliminado/inexistente: `401`.
- Token viejo con rol `admin` pero rol actual en BD `cliente`: `403`.

---

## PARTE 4: Validación Fuerte de Datos (Zod)

**Fecha**: 2 de mayo de 2026

### Implementado

- Instalación de `zod`.
- Middleware reusable:
  - `validateBody(schema)`
  - `validateParams(schema)`
  - `validateQuery(schema)`
- Schemas por módulo en `src/validations/`:
  - `common.validation.js`
  - `auth.validation.js`
  - `usuario.validation.js`
  - `turnos.validation.js`
  - `redsocial.validation.js`

### Respuesta de error unificada

HTTP `400`:

```json
{
  "message": "Datos inválidos",
  "errors": [
    { "field": "campo", "message": "Mensaje de validación" }
  ]
}
```

### Cobertura principal

- Validación estricta de body en auth, usuario, turnos y red social.
- Validación de params `:id` y `:postId` como enteros positivos.
- Validación de query (paginación, search, estado, sort/order, fechas).
- Normalización de entrada (trim/lowercase para email).
- Protección contra mass assignment al evitar `data: req.body` en operaciones críticas.

### Compatibilidad

- No se cambiaron rutas.
- Se mantiene compatibilidad del reset de contraseña legacy: body extra se ignora con `.strip()` y no se usa `userId` del frontend para el cambio real de contraseña.

**Próximo paso**: Cuando estés listo, aplicar PARTE 2 de seguridad (refresh tokens, logging centralizado, tests, etc.)
