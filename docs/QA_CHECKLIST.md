# QA Checklist

- Backend arranca con `.env` local.
- Frontend compila con `npm run build`.
- Login y registro funcionan.
- `/reservar` muestra solo turnos disponibles dentro de la ventana correcta.
- Dashboard admin carga métricas reales.
- Crear post permite imagen sola o imagen + descripción.
- Subida de foto de perfil funciona con Cloudinary.

## Validaciones y mensajes de formularios

- Login vacío: muestra "El email es obligatorio." y/o "La contraseña es obligatoria.".
- Login inválido: muestra "Ingresá un email válido.".
- Login credenciales incorrectas: muestra "Email o contraseña incorrectos.".
- Registro valida nombre, email, contraseña (mínimo 8 + letras/números) y WhatsApp.
- Recuperar contraseña: siempre responde con mensaje genérico seguro para no filtrar existencia de email.
- Reset password: token inválido/vencido se muestra con mensaje amigable.
- Reserva sin cuenta: valida nombre y WhatsApp; email solo si fue ingresado.
- Reserva/cancelación: mensajes de negocio claros (turno pasado, poca anticipación, turno ocupado).
- Admin crear/generar turnos: mensajes específicos para fecha, hora, intervalo y días.
- Posts/comentarios: comentario vacío o largo se informa con mensajes claros.
- No deben aparecer textos técnicos tipo "Required", "Invalid input", "Expected string", "Bad Request".
