# Validacion de Datos en Backend (PASO 4)

Fecha: 2 de mayo de 2026

## Libreria

Se usa Zod para validar body, params y query.

- Middleware: src/middlewares/validate.middleware.js
- Schemas:
  - src/validations/common.validation.js
  - src/validations/auth.validation.js
  - src/validations/usuario.validation.js
  - src/validations/turnos.validation.js
  - src/validations/redsocial.validation.js

## Middlewares reutilizables

- validateBody(schema)
- validateParams(schema)
- validateQuery(schema)

Formato de error de validacion (HTTP 400):

{
  "message": "Datos inválidos",
  "errors": [
    { "field": "email", "message": "Email inválido" }
  ]
}

## Reglas principales

1. Body estricto
- Se usa .strict() para rechazar campos no permitidos.
- Excepcion de compatibilidad: reset-password body usa .strip() para ignorar campos legacy (por ejemplo userId) sin romper frontend.

2. IDs en params
- Todos los :id / :postId se validan como enteros positivos.
- Se evita que Prisma reciba NaN o valores invalidos.

3. Query params
- Validacion de page/limit/search/sort/order/estado segun endpoint.
- Limites maximos:
  - Admin: limit max 100
  - Publico: limit max 50

4. Normalizacion
- email: trim + lowercase
- strings: trim
- horas: formato HH:mm
- fechas: formato esperado y conversion segura posterior

5. Mass assignment
- No se usa data: req.body en Prisma para create/update criticos.
- Se mantiene mapeo explicito de campos permitidos.

## Campos prohibidos desde frontend (ejemplos)

No se aceptan en body de endpoints criticos:
- rol, isAdmin, admin
- passwordHash, resetToken, refreshToken
- createdAt, updatedAt
- usuarioId/autorId/clienteId/estado en endpoints donde esos campos se derivan en backend

## Endpoints cubiertos

Auth:
- POST /api/auth/registrar
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password/:token

Usuario:
- PUT /api/usuario/me
- PUT /api/usuario/subir-foto
- GET /api/usuario/clientes (query)

Turnos:
- GET /api/turnos/disponibles (query)
- POST /api/turnos/anonimo
- POST /api/turnos/cliente
- GET /api/turnos/historial (query)
- PUT /api/turnos/cancelarCliente/:id
- GET /api/turnos/admin (query)
- POST /api/turnos/crear
- POST /api/turnos/generar-semana
- PUT /api/turnos/marcar-cortado/:id
- DELETE /api/turnos/:id

Red social:
- GET /api/redsocial/posts (query)
- POST /api/redsocial/crear-post
- POST /api/redsocial/like/:postId
- POST /api/redsocial/comentar/:postId
- DELETE /api/redsocial/posts/:postId

## Compatibilidad

No se cambiaron nombres de rutas ni contratos principales esperados por frontend.
Se agregaron validaciones fuertes en backend para bloquear entradas malformadas.
