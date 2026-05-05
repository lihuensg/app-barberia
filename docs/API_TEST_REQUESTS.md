# API Test Requests - NazaBarber

Guía rápida para QA manual con `curl`.

## Variables

```bash
BASE_URL=http://localhost:3000
ADMIN_EMAIL=admin@nazabarber.com
ADMIN_PASS=admin123
CLIENT_EMAIL=cliente.test@nazabarber.test
CLIENT_PASS=cliente123
```

## Health

```bash
curl -s "$BASE_URL/api/healthz"
```

## Auth

### Registro cliente

```bash
curl -X POST "$BASE_URL/api/auth/registrar" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Cliente QA","email":"qa.cliente@test.com","password":"Password123"}'
```

### Login admin

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"
```

### Login cliente

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$CLIENT_PASS\"}"
```

### Login inválido (401)

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"noexiste@test.com","password":"bad"}'
```

## Usuario

### Me sin token (401)

```bash
curl -i "$BASE_URL/api/usuario/me"
```

### Me con token

```bash
curl -i "$BASE_URL/api/usuario/me" \
  -H "Authorization: Bearer <TOKEN>"
```

## Turnos

### Disponibles (público)

```bash
curl -s "$BASE_URL/api/turnos/disponibles?page=1&limit=20"
```

### Cliente reserva turno

```bash
curl -X POST "$BASE_URL/api/turnos/cliente" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -d '{"turnoId": 1}'
```

### Cliente cancela turno

```bash
curl -X PUT "$BASE_URL/api/turnos/cancelarCliente/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -d '{"motivo":"No puedo asistir"}'
```

### Admin lista turnos

```bash
curl -s "$BASE_URL/api/turnos/admin?page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Admin crea turno

```bash
curl -X POST "$BASE_URL/api/turnos/crear" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"fecha":"2026-06-01","hora":"10:00"}'
```

### Admin genera semana

```bash
curl -X POST "$BASE_URL/api/turnos/generar-semana" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"fechaInicio":"2026-06-01","horaInicio":"09:00","horaFin":"12:00","intervaloMinutos":30,"cantidadDias":7}'
```

## Red social

### Posts público

```bash
curl -s "$BASE_URL/api/redsocial/posts?page=1&limit=10"
```

### Admin crea post

```bash
curl -X POST "$BASE_URL/api/redsocial/crear-post" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"imagen":"https://example.com/img.jpg","descripcion":"Post QA"}'
```

### Comentar post

```bash
curl -X POST "$BASE_URL/api/redsocial/comentar/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -d '{"texto":"Excelente corte"}'
```

### Like toggle

```bash
curl -X POST "$BASE_URL/api/redsocial/like/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -d '{}'
```

## Auditoría

### Ver logs (admin)

```bash
curl -s "$BASE_URL/api/admin/audit-logs?page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Limpiar audit logs antiguos

```bash
cd backend
npm run cleanup:audit
```

## Tests automáticos backend

```bash
cd backend
npm install
npm test
```
