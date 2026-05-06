# Business Rules

- Reserva mínima: 10 minutos de anticipación.
- Cancelación mínima: 1 hora de anticipación (`CANCEL_MIN_HOURS=1`).
- Los turnos y métricas deben respetar la hora local de negocio.
- Los posts eliminados no deben contarse en métricas visibles.
- Cuando un cliente o admin cancela una reserva, el turno vuelve a estado `disponible` y se libera para una nueva reserva.
- Cada cancelación se registra en `TurnoCancelacion` con snapshot del cliente para no perder historial.
- Las métricas de cancelados (hoy/semana/mes) se calculan sobre `TurnoCancelacion.canceladoEn`, no sobre el estado actual del turno.
