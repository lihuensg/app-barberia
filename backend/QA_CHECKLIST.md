# QA Checklist - NazaBarber (PASO 7)

Estado sugerido por fila: `pendiente` / `ok` / `falla`.

## Entorno de prueba

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Admin test: `admin@nazabarber.com / admin123` (ajustar si fue cambiado)
- Cliente test: crear uno nuevo desde registro
- Auditoría:
  - `AUDIT_ENABLED=true` para validar eventos
  - `AUDIT_ENABLED=false` para validar que no se persiste

## Matriz de pruebas manuales

| Módulo | Caso | Acción | Datos a usar | Resultado esperado | Estado |
|---|---|---|---|---|---|
| Auth | Registro cliente válido | `POST /api/auth/registrar` | `nombre,email,password` válidos | 201, usuario creado con rol `cliente`, sin `passwordHash` | pendiente |
| Auth | Registro con email inválido | `POST /api/auth/registrar` | `email: "no-es-email"` | 400 `Datos inválidos` | pendiente |
| Auth | Registro con body malicioso admin | `POST /api/auth/registrar` | incluir `rol:"admin"` | 400 por schema strict o ignorado; nunca admin en DB | pendiente |
| Auth | Login admin correcto | `POST /api/auth/login` | credenciales admin válidas | 200, token JWT, usuario sin `passwordHash` | pendiente |
| Auth | Login cliente correcto | `POST /api/auth/login` | credenciales cliente válidas | 200, token JWT, usuario sin `passwordHash` | pendiente |
| Auth | Login incorrecto | `POST /api/auth/login` | password errónea | 401 con mensaje genérico | pendiente |
| Auth | Rate limit login | repetir login inválido > 5 veces | mismo IP | 429 | pendiente |
| Usuarios | `/me` sin token | `GET /api/usuario/me` | sin `Authorization` | 401 | pendiente |
| Usuarios | `/me` con token | `GET /api/usuario/me` | token válido cliente | 200, usuario sanitizado sin `passwordHash` | pendiente |
| Recuperación | Forgot con email existente | `POST /api/auth/forgot-password` | email admin/cliente existente | respuesta genérica, email enviado, audit `PASSWORD_RESET_REQUESTED` | pendiente |
| Recuperación | Forgot con email inexistente | `POST /api/auth/forgot-password` | email random | misma respuesta genérica | pendiente |
| Recuperación | Reset con token válido | `POST /api/auth/reset-password/:token` | token válido + password fuerte | 200, password cambia, audit `PASSWORD_RESET_SUCCESS` | pendiente |
| Recuperación | Reuso token | repetir reset con mismo token | mismo token usado | 400/401 | pendiente |
| Recuperación | Token vencido | reset con token expirado | token expirado | 400/401 | pendiente |
| Recuperación | Password débil | reset con password corta | `newPassword: "123"` | 400 | pendiente |
| Recuperación | No logging token plano | revisar logs y DB | ejecutar forgot/reset | nunca token plano en logs ni `AuditLog` | pendiente |
| Seguridad admin | Admin endpoint sin token | `GET /api/turnos/admin` | sin token | 401 | pendiente |
| Seguridad admin | Admin endpoint token cliente | `GET /api/turnos/admin` | token cliente | 403 | pendiente |
| Seguridad admin | Admin endpoint token admin | `GET /api/turnos/admin` | token admin | 200 | pendiente |
| Seguridad admin | Crear turno con cliente | `POST /api/turnos/crear` | token cliente | 403 | pendiente |
| Seguridad admin | Crear turno con admin | `POST /api/turnos/crear` | token admin | 201 | pendiente |
| Seguridad admin | Clientes con cliente | `GET /api/usuario/clientes` | token cliente | 403 | pendiente |
| Seguridad admin | Clientes con admin | `GET /api/usuario/clientes` | token admin | 200 sin `passwordHash` | pendiente |
| Seguridad admin | Token viejo degradado | emitir token admin, bajar rol en DB, reutilizar token | token antiguo | 403 por control en DB | pendiente |
| Turnos cliente | Reserva turno disponible | `POST /api/turnos/cliente` | token cliente + `turnoId` disponible | 201, turno `reservado`, asociado a cliente, audit `CLIENTE_RESERVO_TURNO` | pendiente |
| Turnos cliente | Doble reserva mismo turno | 2 clientes sobre mismo `turnoId` | turno ya tomado | segundo request 409 | pendiente |
| Turnos cliente | Historial propio | `GET /api/turnos/historial` | token cliente A | solo turnos del cliente A | pendiente |
| Turnos cliente | Cancelación permitida | `PUT /api/turnos/cancelarCliente/:id` | turno propio futuro y > `CANCEL_MIN_HOURS` | 200, estado `cancelado`, audit `CLIENTE_CANCELO_TURNO` | pendiente |
| Turnos cliente | Cancelar turno ajeno | cancelar id de otro cliente | token cliente A, turno cliente B | 403 | pendiente |
| Turnos cliente | Cancelar turno pasado | cancelar turno pasado | turno en fecha/hora pasada | 400 | pendiente |
| Turnos cliente | Cancelar turno cortado | cancelar turno `cortado` | turno no reservado | 400 | pendiente |
| Turnos cliente | Cancelar con poca anticipación | cancelar < `CANCEL_MIN_HOURS` | turno cercano | 400 | pendiente |
| Turnos cliente | Body malicioso en reserva | `POST /api/turnos/cliente` | incluir `usuarioId` de otro | se ignora; asigna `req.user.id` | pendiente |
| Turnos admin | Crear turno válido | `POST /api/turnos/crear` | fecha futura + hora válida | 201, `disponible`, audit `ADMIN_CREO_TURNO` | pendiente |
| Turnos admin | Crear turno pasado | `POST /api/turnos/crear` | fecha pasada | 400 | pendiente |
| Turnos admin | Crear turno duplicado | repetir misma fecha/hora | existente | 409 | pendiente |
| Turnos admin | Generar semana | `POST /api/turnos/generar-semana` | ventana válida | `creados > 0`, `omitidos >= 0`, audit `ADMIN_GENERO_TURNOS` | pendiente |
| Turnos admin | Regenerar misma semana | repetir request | mismos datos | no duplica; `omitidos > 0` | pendiente |
| Turnos admin | Marcar cortado válido | `PUT /api/turnos/marcar-cortado/:id` | turno `reservado` | 200, estado `cortado`, audit `ADMIN_MARCO_CORTADO` | pendiente |
| Turnos admin | Marcar cortado inválido | marcar turno `disponible` | estado incorrecto | 400 | pendiente |
| Turnos admin | Eliminar turno | `DELETE /api/turnos/:id` | token admin | 200, audit `ADMIN_ELIMINO_TURNO` | pendiente |
| Red social | Posts público | `GET /api/redsocial/posts` | sin token | 200, sin datos sensibles (`passwordHash`, emails internos) | pendiente |
| Red social | Cliente crear post | `POST /api/redsocial/crear-post` | token cliente | 403 | pendiente |
| Red social | Admin crear post válido | `POST /api/redsocial/crear-post` | token admin + body válido | 201, audit `ADMIN_CREO_POST` | pendiente |
| Red social | Admin crear post vacío | `POST /api/redsocial/crear-post` | body vacío/inválido | 400 | pendiente |
| Red social | Comentar válido | `POST /api/redsocial/comentar/:postId` | token cliente + texto | 201 | pendiente |
| Red social | Comentar vacío | `POST /api/redsocial/comentar/:postId` | `texto:""` | 400 | pendiente |
| Red social | Comentar espacios | `POST /api/redsocial/comentar/:postId` | `texto:"   "` | 400 | pendiente |
| Red social | Comentar >500 chars | `POST /api/redsocial/comentar/:postId` | texto de 501 | 400 | pendiente |
| Red social | XSS en comentario | comentar `<script>alert(1)</script>` | texto script | se guarda escapado o se rechaza; nunca ejecuta | pendiente |
| Red social | Like toggle on | `POST /api/redsocial/like/:postId` | primera vez | `liked=true` | pendiente |
| Red social | Like toggle off | repetir like | segunda vez | `liked=false` | pendiente |
| Red social | Sin likes duplicados | revisar DB likes | mismo user/post | no hay duplicados | pendiente |
| Red social | Admin elimina post | `DELETE /api/redsocial/posts/:postId` | token admin | 200, audit `ADMIN_ELIMINO_POST`, no visible si soft-delete | pendiente |
| Validaciones | ID inválido cancelar | `PUT /api/turnos/cancelarCliente/abc` | param inválido | 400 | pendiente |
| Validaciones | postId inválido like | `POST /api/redsocial/like/abc` | param inválido | 400 | pendiente |
| Validaciones | limit excesivo | `GET /api/turnos/admin?limit=10000` | query inválida | 400 o clamp por regla | pendiente |
| Validaciones | fecha inválida crear turno | `POST /api/turnos/crear` | `fecha` inválida | 400 | pendiente |
| Validaciones | Body peligroso | enviar `rol,estado,usuarioId` no permitidos | payload malicioso | 400 o ignorado; DB sin cambios indebidos | pendiente |
| Validaciones | Revisión de código Prisma | buscar `data: req.body` directo | revisión manual | no usar body crudo en Prisma | pendiente |
| Auditoría | Login failed audit | `AUDIT_ENABLED=true`, login inválido | auth/login | `LOGIN_FAILED` en `AuditLog` | pendiente |
| Auditoría | Forgot audit | forgot password | email existente | `PASSWORD_RESET_REQUESTED` | pendiente |
| Auditoría | Reset success audit | reset exitoso | token válido | `PASSWORD_RESET_SUCCESS` | pendiente |
| Auditoría | Reserva cliente audit | reservar turno cliente | turno disponible | `CLIENTE_RESERVO_TURNO` | pendiente |
| Auditoría | Cancelación cliente audit | cancelar turno cliente | turno propio | `CLIENTE_CANCELO_TURNO` | pendiente |
| Auditoría | Admin crea turno audit | crear turno admin | body válido | `ADMIN_CREO_TURNO` | pendiente |
| Auditoría | Admin genera audit | generar semana admin | body válido | `ADMIN_GENERO_TURNOS` | pendiente |
| Auditoría | Admin crea post audit | crear post admin | body válido | `ADMIN_CREO_POST` | pendiente |
| Auditoría | No auditoría de tráfico común | ejecutar GET/likes/comentarios | endpoints públicos frecuentes | no registros nuevos para esos casos | pendiente |
| Auditoría | Sanitización metadata | revisar `AuditLog.metadata` | ejecutar eventos | sin `password`, `token`, `Authorization`, `cookies`, secretos, body/headers completos | pendiente |
| Auditoría | Audit disabled | `AUDIT_ENABLED=false` y acción crítica | por ejemplo login failed | no crea `AuditLog` | pendiente |
| Rate limits | login | exceder intentos | >5 intentos/15 min | 429 | pendiente |
| Rate limits | forgot password | exceder intentos | según configuración | 429 | pendiente |
| Respuestas sensibles | auth/login | inspeccionar JSON | login ok/fail | nunca `passwordHash`, no secretos | pendiente |
| Respuestas sensibles | usuario/clientes | inspeccionar JSON | admin list clientes | sin `passwordHash` ni secretos | pendiente |
| Frontend | Flujo completo usuario/admin | recorrer 20 pasos del módulo frontend | ver lista abajo | UI funcional, errores manejados, sin fallos críticos | pendiente |

## Frontend QA (pasos)

1. Abrir home.
2. Ver turnos disponibles.
3. Registrar cliente.
4. Login cliente.
5. Reservar turno.
6. Ver historial.
7. Cancelar turno permitido.
8. Intentar cancelar no permitido (si UI lo expone).
9. Ver posts.
10. Comentar.
11. Dar like.
12. Login admin.
13. Ver dashboard.
14. Crear turno.
15. Generar semana.
16. Marcar cortado.
17. Crear post.
18. Eliminar post.
19. Logout.
20. Recuperar contraseña.

Checks transversales en frontend:
- Consola sin errores críticos.
- Network sin 500 inesperados.
- Manejo correcto de 401/403.
- Mensajes de error claros para usuario.

## Evidencia recomendada

- Capturas de respuestas HTTP.
- Extractos de `AuditLog` tras cada prueba crítica.
- Logs de backend para errores internos.
- Resultado de `npm test` en backend.
