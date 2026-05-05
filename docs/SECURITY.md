# Security

- No subir secretos reales al repositorio.
- No subir `.env` reales.
- Usar `backend/.env.example` y `frontend/.env.example` como plantillas.
- Las credenciales de Cloudinary, Resend y PostgreSQL deben vivir solo en variables de entorno locales o de despliegue.
- No exponer `JWT_SECRET`, `REFRESH_TOKEN_SECRET` ni `CLOUDINARY_API_SECRET` en frontend o documentación pública.
