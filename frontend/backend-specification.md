# Especificación Técnica del Backend: NazaBarber

Este documento detalla los requerimientos técnicos, rutas de API, modelos de datos y consideraciones de seguridad necesarios para desarrollar el backend que soportará el frontend de NazaBarber.

---

## 1. Arquitectura y Seguridad

### 1.1. Autenticación y Autorización
- **Método**: Autenticación basada en tokens JWT (JSON Web Tokens).
- **Flujo**:
  - El usuario se autentica vía `/api/auth/login`.
  - El backend retorna un token JWT firmado.
  - El frontend almacena el token.
  - En cada petición protegida, el frontend envía el token en el header: `Authorization: Bearer <token>`.
- **Roles**:
  - `cliente`: Puede ver sus turnos, reservar, comentar y dar like.
  - `admin`: Tiene acceso a todas las rutas protegidas, gestión de turnos, generación masiva de horarios, métricas y panel completo de clientes.

---

## 2. Modelos de Base de Datos (Tablas)

A continuación se detalla el esquema relacional sugerido, basado en los tipos estrictos del cliente API.

### Tabla: `usuarios`
Almacena clientes registrados y administradores.
- `id` (INT, Primary Key, Auto-increment)
- `nombre` (VARCHAR, Not Null)
- `email` (VARCHAR, Unique, Not Null)
- `password_hash` (VARCHAR, Not Null) - *Contraseña encriptada (Bcrypt)*
- `telefono` (VARCHAR, Nullable)
- `instagram` (VARCHAR, Nullable)
- `foto` (TEXT, Nullable) - *URL de la imagen de perfil*
- `rol` (ENUM: `'cliente'`, `'admin'`, Default: `'cliente'`)
- `bio` (TEXT, Nullable) - *Solo usado si el usuario es admin*
- `whatsapp` (VARCHAR, Nullable) - *Solo usado si el usuario es admin*

### Tabla: `turnos`
Almacena el calendario y estado de las citas.
- `id` (INT, Primary Key, Auto-increment)
- `fecha` (DATE, Not Null) - *Formato YYYY-MM-DD*
- `hora` (TIME, Not Null) - *Formato HH:mm*
- `estado` (ENUM: `'disponible'`, `'reservado'`, `'cortado'`, `'cancelado'`, Default: `'disponible'`)
- `usuario_id` (INT, Foreign Key -> `usuarios.id`, Nullable) - *ID del cliente si la reserva es con cuenta*
- `anonimo_nombre` (VARCHAR, Nullable) - *Datos si reservan sin cuenta*
- `anonimo_email` (VARCHAR, Nullable)
- `anonimo_telefono` (VARCHAR, Nullable)

### Tabla: `posts`
Feed social / Portfolio del barbero.
- `id` (INT, Primary Key, Auto-increment)
- `imagen` (TEXT, Not Null) - *URL de la foto del trabajo*
- `descripcion` (TEXT, Not Null)
- `autor_id` (INT, Foreign Key -> `usuarios.id`, Not Null)
- `created_at` (DATETIME, Default: CURRENT_TIMESTAMP)

### Tabla: `comentarios`
Comentarios en los posts.
- `id` (INT, Primary Key, Auto-increment)
- `post_id` (INT, Foreign Key -> `posts.id`, Not Null, On Delete Cascade)
- `autor_id` (INT, Foreign Key -> `usuarios.id`, Not Null)
- `texto` (TEXT, Not Null)
- `created_at` (DATETIME, Default: CURRENT_TIMESTAMP)

### Tabla: `likes`
Relación muchos-a-muchos para los "Me Gusta".
- `post_id` (INT, Foreign Key -> `posts.id`, Not Null, On Delete Cascade)
- `usuario_id` (INT, Foreign Key -> `usuarios.id`, Not Null, On Delete Cascade)
- *Primary Key Compuesta (post_id, usuario_id)*

---

## 3. Endpoints de la API REST

Todas las rutas deben responder bajo el prefijo `/api`.

### 3.1. Autenticación (`/api/auth`)
| Método | Endpoint | Body | Descripción |
| :--- | :--- | :--- | :--- |
| **POST** | `/registrar` | `{nombre, email, password, telefono?, instagram?}` | Crea cuenta de cliente y devuelve token. |
| **POST** | `/login` | `{email, password}` | Verifica credenciales y devuelve `{ token, usuario }`. |
| **POST** | `/forgot-password` | `{email}` | Envía correo de recuperación de clave. |
| **POST** | `/reset-password/:token` | `{password}` | Restablece clave usando el token enviado. |

### 3.2. Usuario / Perfil (`/api/usuario`)
| Método | Endpoint | Req. Auth | Descripción |
| :--- | :--- | :--- | :--- |
| **GET** | `/me` | Sí | Devuelve los datos del usuario logueado según el token. |
| **PUT** | `/me` | Sí | Actualiza perfil (nombre, telefono, instagram). |
| **PUT** | `/subir-foto` | Sí | Actualiza avatar del usuario. |
| **GET** | `/admin-publicos` | No | Devuelve datos públicos del admin (nombre, foto, bio, ig, wsp). |
| **GET** | `/clientes` | Sí (Admin) | Lista clientes registrados. Acepta query `?search=xyz`. |

### 3.3. Turnos (`/api/turnos`)
| Método | Endpoint | Req. Auth | Descripción |
| :--- | :--- | :--- | :--- |
| **GET** | `/disponibles` | No | Lista todos los turnos a futuro con `estado=disponible`. |
| **POST** | `/anonimo` | No | Reserva turno sin cuenta: `{turnoId, nombre, email?, telefono?}`. |
| **POST** | `/cliente` | Sí | Reserva turno para el usuario logueado: `{turnoId}`. |
| **GET** | `/historial` | Sí | Historial de turnos del usuario actual. |
| **PUT** | `/cancelarCliente/:id` | Sí | Cancela un turno propio (estado `cancelado`). |

#### Panel Admin
| Método | Endpoint | Req. Auth | Descripción |
| :--- | :--- | :--- | :--- |
| **GET** | `/admin` | Sí (Admin) | Lista todos los turnos. Filtros: `?estado=X&fecha=Y&cliente=Z`. |
| **GET** | `/admin/metrics` | Sí (Admin) | Estadísticas: turnosDisponibles, turnosReservados, turnosCortados, clientes, posts, proximosTurnos. |
| **POST** | `/crear` | Sí (Admin) | Crea turno manual: `{fecha, hora}`. |
| **POST** | `/generar-semana` | Sí (Admin) | Crea semana masiva: `{fechaInicio, horaInicio, horaFin, intervaloMinutos, diasIncluidos}`. |
| **PUT** | `/marcar-cortado/:id` | Sí (Admin) | Pasa turno a `cortado`. |
| **DELETE**| `/:id` | Sí (Admin) | Borra un turno definitivamente. |

### 3.4. Red Social / Feed (`/api/redsocial`)
| Método | Endpoint | Req. Auth | Descripción |
| :--- | :--- | :--- | :--- |
| **GET** | `/posts` | No | Lista posts. *El backend debe verificar `likedByMe` según el usuario logueado.* |
| **POST** | `/crear-post` | Sí (Admin) | Publica nuevo trabajo: `{imagen, descripcion}`. |
| **POST** | `/like/:postId` | Sí | Alterna (toggle) el like del usuario al post. |
| **POST** | `/comentar/:postId` | Sí | Agrega un comentario: `{texto}`. |
| **DELETE**| `/posts/:postId` | Sí (Admin) | Elimina un posteo. |

---

## 4. Lógica de Negocio Importante
1. **Reserva Atómica**: Al recibir `/api/turnos/cliente` o `anonimo`, el backend debe bloquear (transacción) la fila del turno para evitar colisiones (doble reserva simultánea).
2. **Respuesta de Posts (likedByMe)**: Al retornar los `Posts`, el backend debe verificar en la tabla `likes` si el usuario de la petición (si envió token) ya le dio like, y popular el campo `likedByMe: true/false`.
3. **Generador de Semana**: `/api/turnos/generar-semana` genera turnos repetitivos. Debe iterar desde la `horaInicio` hasta `horaFin` sumando `intervaloMinutos`. Se debe tener en cuenta solapamientos u horarios de almuerzo personalizados (opcional).
