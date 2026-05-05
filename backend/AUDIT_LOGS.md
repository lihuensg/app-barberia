# Auditoría Selectiva

NazaBarber usa auditoría selectiva para guardar solo acciones críticas y cuidar el storage de Neon Free.

## Variables de entorno

- `AUDIT_ENABLED=true|false`
- `AUDIT_RETENTION_DAYS=90`

Si `AUDIT_ENABLED=false`, la app sigue funcionando pero no guarda logs en la base.

## Acciones auditadas

- `LOGIN_FAILED`
- `PASSWORD_RESET_REQUESTED`
- `PASSWORD_RESET_SUCCESS`
- `CLIENTE_RESERVO_TURNO`
- `CLIENTE_CANCELO_TURNO`
- `ADMIN_CREO_TURNO`
- `ADMIN_GENERO_TURNOS`
- `ADMIN_MARCO_CORTADO`
- `ADMIN_ELIMINO_TURNO`
- `ADMIN_CREO_POST`
- `ADMIN_ELIMINO_POST`

## Datos que nunca se guardan

- passwords
- tokens
- cookies
- headers completos
- bodies completos
- secretos o claves API

La metadata se limita a datos pequeños y puntuales como `turnoId`, `postId`, `estadoAnterior`, `estadoNuevo` o conteos.

## Limpieza

Para borrar logs viejos según la retención configurada:

```bash
npm run cleanup:audit
```

## Endpoint admin de consulta

- `GET /api/admin/audit-logs`
- Requiere token admin.
- Query soportada: `page`, `limit` (max 50), `action`, `entity`, `userId`, `fechaDesde`, `fechaHasta`.

## Nota

Esta auditoría está pensada para ser liviana y no generar almacenamiento innecesario en Neon Free.