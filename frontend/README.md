# Frontend Barbería

Frontend Vite + React + TypeScript con estética glass/dark y mock REST listo para reemplazar por backend real.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Mock REST

Con el mock activo, la app responde a estas rutas:

- `GET /api/dashboard`
- `GET /api/posts`
- `GET /api/slots`
- `POST /api/reservations`

Las pantallas consumen esas rutas desde [src/lib/api.ts](src/lib/api.ts).

## Conectar backend real

1. Crear un archivo `.env` en `frontend/`.
2. Definir la base de tu API:

```env
VITE_API_BASE_URL=https://tu-backend.com
VITE_USE_MOCK_API=false
```

3. Mantener las mismas rutas o adaptar [src/lib/api.ts](src/lib/api.ts) si tu backend usa otros paths.
4. Si querés seguir probando sin backend, omití `VITE_USE_MOCK_API=false` y el frontend seguirá usando el mock interno.

## Notas

- El mock de red se inicializa en [src/main.tsx](src/main.tsx).
- La UI está preparada para seguir recibiendo datos por fetch sin tocar las páginas.
- La ruta de reserva usa un POST de mock y valida slot, nombre y teléfono.
