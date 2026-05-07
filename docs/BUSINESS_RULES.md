# Business Rules

- Reserva mínima: 10 minutos de anticipación.
- Cancelación mínima: 1 hora de anticipación (`CANCEL_MIN_HOURS=1`).
- Los turnos y métricas deben respetar la hora local de negocio.
- Los posts eliminados no deben contarse en métricas visibles.
- Cuando un cliente o admin cancela una reserva, el turno vuelve a estado `disponible` y se libera para una nueva reserva.
- Cada cancelación se registra en `TurnoCancelacion` con snapshot del cliente para no perder historial.
- Las métricas de cancelados (hoy/semana/mes) se calculan sobre `TurnoCancelacion.canceladoEn`, no sobre el estado actual del turno.

## Integración gratuita de WhatsApp (wa.me)

- Se agregó soporte para enlaces gratuitos de WhatsApp (`https://wa.me/<telefono>?text=...`).
- Reservas sin cuenta ahora requieren un número de WhatsApp válido y se guarda la versión original y normalizada.
- No se utiliza ninguna API paga ni envío automático: los enlaces abren WhatsApp Web/App y el usuario/admin debe tocar "Enviar".
- No se utiliza ninguna API paga ni envío automático: los enlaces abren WhatsApp Web/App y el usuario/admin debe tocar "Enviar".
- Fuente de datos del barbero/admin: el perfil del admin en la base de datos es la fuente única de verdad para `telefono`, `whatsapp` e `instagram`.
- Las variables de entorno `VITE_WHATSAPP_ADMIN_PHONE` y `WHATSAPP_ADMIN_PHONE` sólo deben usarse como fallback temporal si no hay admin configurado en la DB.
