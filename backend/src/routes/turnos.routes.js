const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const { adminGenerarSemanaLimiter, adminEliminarLimiter } = require('../middlewares/rateLimiter.middleware');
const turnosController = require('../controllers/turnos.controller');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate.middleware');
const {
	turnosDisponiblesQuerySchema,
	reservarAnonimoBodySchema,
	reservarClienteBodySchema,
	historialQuerySchema,
	cancelarClienteParamsSchema,
	cancelarClienteBodySchema,
	adminTurnosQuerySchema,
	crearTurnoBodySchema,
	asignarTurnoBodySchema,
	generarSemanaBodySchema,
	marcarCortadoParamsSchema,
	marcarCortadoBodySchema,
	eliminarTurnoParamsSchema,
} = require('../validations/turnos.validation');

router.get('/disponibles', validateQuery(turnosDisponiblesQuerySchema), turnosController.getDisponibles);
router.post('/anonimo', validateBody(reservarAnonimoBodySchema), turnosController.reservarAnonimo);
router.post('/cliente', authMiddleware, validateBody(reservarClienteBodySchema), turnosController.reservarCliente);
router.get('/historial', authMiddleware, validateQuery(historialQuerySchema), turnosController.historialCliente);
router.put('/cancelarCliente/:id', authMiddleware, validateParams(cancelarClienteParamsSchema), validateBody(cancelarClienteBodySchema), turnosController.cancelarCliente);

router.get('/admin', authMiddleware, adminMiddleware, validateQuery(adminTurnosQuerySchema), turnosController.getAdminTurnos);
router.get('/admin/metrics', authMiddleware, adminMiddleware, turnosController.getMetrics);
router.post('/crear', authMiddleware, adminMiddleware, validateBody(crearTurnoBodySchema), turnosController.crearTurno);
router.post('/admin/asignar', authMiddleware, adminMiddleware, validateBody(asignarTurnoBodySchema), turnosController.asignarTurnoAdmin);
router.post('/generar-semana', authMiddleware, adminGenerarSemanaLimiter, adminMiddleware, validateBody(generarSemanaBodySchema), turnosController.generarSemana);
router.put('/marcar-cortado/:id', authMiddleware, adminMiddleware, validateParams(marcarCortadoParamsSchema), validateBody(marcarCortadoBodySchema), turnosController.marcarCortado);
router.delete('/:id', authMiddleware, adminEliminarLimiter, adminMiddleware, validateParams(eliminarTurnoParamsSchema), turnosController.eliminarTurno);

module.exports = router;