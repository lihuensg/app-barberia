# 🔒 PARTE 2: Seguridad - Lógica de Negocio

**Fecha**: 1 de mayo de 2026  
**Status**: ✅ **COMPLETADO**  
**Objetivo**: Endurecer la lógica de negocio para evitar abusos reales

---

## 📋 Resumen de Cambios

### ✅ Implementado

#### 0. **Turnos: Reglas de Reserva y Disponibilidad**

**Reglas vigentes**:
- El cliente solo ve turnos con `fechaHora > ahora + MIN_BOOKING_NOTICE_MINUTES`
- No se muestran turnos pasados en `GET /api/turnos/disponibles`
- No se permite reservar turnos pasados ni dentro del margen mínimo
- Un cliente autenticado solo puede tener 1 turno activo futuro
- La reserva sigue siendo atómica para evitar doble reserva

**Variables nuevas**:
```env
MIN_BOOKING_NOTICE_MINUTES=30
CANCEL_MIN_HOURS=3
```

**Mensajes principales**:
```json
{ "message": "No podés reservar un turno que ya pasó" }
{ "message": "No podés reservar un turno con tan poca anticipación" }
{ "message": "Ya tenés un turno reservado. Cancelalo o esperá a que finalice para reservar otro." }
```

#### 0.1. **Admin: Asignar turno a cliente con advertencia**

**Nuevo endpoint**:
```http
POST /api/turnos/admin/asignar
```

**Body**:
```json
{
   "turnoId": 50,
   "usuarioId": 2,
   "force": false
}
```

**Comportamiento**:
- Si el cliente ya tiene un turno activo futuro y `force=false`, responde `409` con `requiresConfirmation=true`
- Si `force=true`, asigna igualmente el turno
- No bloquea la creación normal de turnos disponibles ni la generación semanal

#### 1. **Turnos: Validación de Ownership**

**Problema**: Un cliente podría cancelar/modificar turnos ajenos.

**Solución**:
- `cancelarCliente()`: Ahora valida que el turno perteneca al usuario autenticado
- Si no pertenece: `403 Forbidden`
- Si no existe: `404 Not Found`

**Código**:
```javascript
if (turno.usuarioId !== parseInt(usuarioId)) {
    error.status = 403;
    throw new Error('No tenés permiso para cancelar este turno');
}
```

#### 2. **Turnos: Evitar Doble Reserva (Ya existía ✓)**

**Status**: Ya implementado con `updateMany` atómico

```javascript
const updated = await prisma.turno.updateMany({
    where: { id: turnoId, estado: 'disponible' },
    data: { estado: 'reservado', usuarioId }
});

if (updated.count === 0) {
    error.status = 409;
    throw new Error('El turno ya fue reservado');
}
```

#### 3. **Turnos: Reglas de Cancelación con CANCEL_MIN_HOURS**

**Nueva Variable**: `CANCEL_MIN_HOURS=3` (en .env)

**Reglas**:
- ✅ No cancelar turno ajeno (validado)
- ✅ No cancelar turno pasado
- ✅ No cancelar turno en estado no RESERVADO
- ✅ No cancelar con menos de CANCEL_MIN_HOURS horas

**Ejemplo**:
```
Turno a las 15:00 hoy
Hora actual: 12:30
Horas hasta: 2.5 horas
CANCEL_MIN_HOURS: 3

❌ Resultado: No se puede cancelar (falta 0.5 horas)
```

**Respuesta si falla**:
```json
{
  "message": "No podés cancelar un turno con menos de 3 horas de anticipación"
}
```

#### 4. **Turnos: Crear Turno Admin (Sin Duplicados)**

**Cambios**:
- ✅ Validar que fecha no sea pasada
- ✅ Validar que hora tenga formato válido (HH:mm)
- ✅ Validar que no exista turno duplicado (409)
- ✅ Solo admin (ya tenía adminMiddleware)

**Respuesta si duplicado**:
```json
{
  "status": 409,
  "message": "Ya existe un turno para esa fecha y hora"
}
```

#### 5. **Red Social: Comentarios**

**Cambios**:
- ✅ Validar que comentario no esté vacío
- ✅ Validar máximo 500 caracteres
- ✅ Validar que post existe (404 si no)
- ✅ Trim automático de espacios

**Respuestas**:
```json
// Si vacío
{ "message": "El comentario no puede estar vacío" }

// Si muy largo
{ "message": "El comentario no puede superar los 500 caracteres" }

// Si post no existe
{ "message": "Post no encontrado" }
```

#### 6. **Red Social: Likes**

**Cambios**:
- ✅ Validar que post existe
- ✅ Devolver conteo de likes actual (likesCount)
- ✅ Mejor manejo de race conditions
- ✅ Unique constraint [postId, usuarioId] previene duplicados

**Respuesta mejorada**:
```json
{
  "liked": true,
  "likesCount": 5
}
```

#### 7. **Red Social: Posts**

**Status**: Ya protegido ✓
- ✅ Crear post: solo admin (adminMiddleware)
- ✅ Eliminar post: solo admin (adminMiddleware)
- ✅ Validar que post existe antes de eliminar (404)

---

## 🔧 Variables de Entorno

### Nueva Variable

```env
# Horas mínimas de anticipación para cancelar turno
CANCEL_MIN_HOURS=3
```

### Configuración

En `backend/src/config/env.js`:
```javascript
CANCEL_MIN_HOURS: parseInt(process.env.CANCEL_MIN_HOURS || '3', 10),
```

---

## 📊 Cambios de Código

### Archivos Modificados

1. **`backend/.env.example`**
   - Agregada sección "BUSINESS RULES"
   - Nueva variable: CANCEL_MIN_HOURS

2. **`backend/.env`** (local)
   - Agregada: `CANCEL_MIN_HOURS=3`

3. **`backend/src/config/env.js`**
   - Agregada variable CANCEL_MIN_HOURS al objeto ENV
   - Valor por defecto: 3

4. **`backend/src/repositories/turnos.repository.js`**
   - `cancelarCliente()`: Validaciones de ownership, fecha pasada, anticipación
   - `crearTurno()`: Validaciones de fecha pasada, duplicados

5. **`backend/src/services/turnos.service.js`**
   - `cancelarCliente()`: Mejor propagación de errores

6. **`backend/src/services/redsocial.service.js`**
   - `comentarPost()`: Validación de max 500 caracteres
   - `toggleLike()`: Devuelve likesCount, mejor manejo de errores

---

## 🧪 Casos de Testing

### Turnos - Cancelación

1. **Cliente cancela turno propio (futuro, >3h)**
   - Esperado: ✅ 200 cancelado

2. **Cliente intenta cancelar turno ajeno**
   - Esperado: ❌ 403 Forbidden

3. **Cliente intenta cancelar turno inexistente**
   - Esperado: ❌ 404 Not Found

4. **Cliente intenta cancelar turno en el pasado**
   - Esperado: ❌ 400 (turno en pasado)

5. **Cliente intenta cancelar turno con <3h de anticipación**
   - Esperado: ❌ 400 (menos de 3 horas)

6. **Cliente intenta cancelar turno en estado "cortado"**
   - Esperado: ❌ 400 (estado inválido)

### Turnos - Doble Reserva

7. **Cliente A y B intentan reservar mismo turno simultáneamente**
   - Esperado: Uno gana (200), otro recibe 409 (ya reservado)

### Turnos - Admin Crear

8. **Admin crea turno en fecha pasada**
   - Esperado: ❌ 400

9. **Admin crea turno duplicado (misma fecha/hora)**
   - Esperado: ❌ 409

10. **Admin crea turno válido**
    - Esperado: ✅ 201 creado

### Red Social - Comentarios

11. **Usuario comenta vacío**
    - Esperado: ❌ 400

12. **Usuario comenta >500 caracteres**
    - Esperado: ❌ 400

13. **Usuario comenta en post inexistente**
    - Esperado: ❌ 404

14. **Usuario comenta válido**
    - Esperado: ✅ 201 creado

### Red Social - Likes

15. **Usuario da like a post**
    - Esperado: ✅ `{ liked: true, likesCount: 1 }`

16. **Usuario quita like (toggle)**
    - Esperado: ✅ `{ liked: false, likesCount: 0 }`

17. **Usuario intenta dar like a post inexistente**
    - Esperado: ❌ 404

---

## 🔐 Resumen de Seguridad

| Aspecto | Implementado | Detalles |
|---------|-------------|----------|
| **Ownership Turnos** | ✅ | 403 si no pertenece, 404 si no existe |
| **Doble Reserva** | ✅ | Query atómica updateMany |
| **Cancelación Validada** | ✅ | Fecha, anticipación, estado, usuario |
| **Turnos Admin** | ✅ | Sin duplicados, sin fechas pasadas |
| **Comentarios Max** | ✅ | 500 caracteres |
| **Likes Único** | ✅ | Unique constraint, manejo de race |
| **Posts Admin** | ✅ | adminMiddleware en rutas |
| **Códigos HTTP** | ✅ | 400, 403, 404, 409 apropiados |

---

## 📈 Próximas Mejoras (NO Incluidas en PARTE 2)

- [ ] Auditoría de acciones críticas (tabla AuditLog)
- [ ] Soft delete para turnos/posts (deletedAt)
- [ ] Rate limiting en comentarios
- [ ] Validación de body con Zod schemas
- [ ] Transacciones Prisma para operaciones complejas
- [ ] Logging detallado de intentos bloqueados
- [ ] Dashboard admin para ver intentos de fraude

---

## ⚠️ Impacto en Frontend

**¡Buena noticia!** No hay breaking changes:

- Los endpoints siguen existiendo con los mismos nombres
- Las respuestas devuelven los mismos datos
- Solo se agregaron validaciones más estrictas

**Cambios menores visibles**:
- Códigos HTTP más precisos (ahora 403 cuando no es dueño)
- Mensajes de error más claros
- Comentarios: si envían >500 chars, reciben 400

---

## 🚀 Deployment

### Local

```bash
cd backend
npm run dev
```

Backend validará CANCEL_MIN_HOURS al iniciar:
```
✅ Variables de entorno validadas correctamente
```

### Producción (Render)

Agregar en Environment Variables:
```
CANCEL_MIN_HOURS=3
```

O dejar vacío para usar default (3).

---

## 📚 Referencias en Código

### Validación de Ownership
- `backend/src/repositories/turnos.repository.js:93-99`

### Cancelación Validada
- `backend/src/repositories/turnos.repository.js:72-139`

### Crear Turno Admin
- `backend/src/repositories/turnos.repository.js:142-180`

### Comentarios Max Length
- `backend/src/services/redsocial.service.js:85-96`

---

## ✅ Checklist Final

- [x] Validación de ownership en turnos
- [x] Cancelación con anticipación mínima
- [x] Crear turno sin duplicados
- [x] Comentarios con max length
- [x] Likes con conteo
- [x] Posts solo admin
- [x] Códigos HTTP correctos
- [x] Variables de entorno
- [x] Documentación
- [x] Sin breaking changes en frontend

---

**Status**: ✅ PARTE 2 Completa y Lista para Testing

Próximo paso: Ejecutar backend y probar los casos de testing.
