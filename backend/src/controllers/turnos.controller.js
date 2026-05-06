const turnosService = require('../services/turnos.service');
const { logAdminAction } = require('../utils/adminAudit');
const { auditLog, getAuditContext } = require('../services/audit.service');

async function getDisponibles(req, res) {
    try {
        const turnos = await turnosService.getDisponibles(req.query);
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar turnos disponibles' });
    }
}

async function reservarAnonimo(req, res) {
    try {
        const turno = await turnosService.reservarAnonimo(req.body);
        res.status(201).json({
            message: 'Turno reservado correctamente',
            turno
        });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al reservar turno'
        });
    }
}

async function reservarCliente(req, res) {
    try {
        const turno = await turnosService.reservarCliente(req.usuario.id, req.body);
        // Auditar reserva de cliente (no guardar datos sensibles)
        try {
            const ctx = getAuditContext(req);
            void auditLog({
                userId: req.usuario.id,
                action: 'CLIENTE_RESERVO_TURNO',
                entity: 'Turno',
                entityId: turno.id,
                status: 'SUCCESS',
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                metadata: {
                    estadoNuevo: 'reservado',
                    fecha: turno.fecha,
                    hora: turno.hora
                }
            });
        } catch (e) { /* no-op */ }

        res.status(201).json({
            message: 'Turno reservado correctamente',
            turno
        });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al reservar turno'
        });
    }
}

async function historialCliente(req, res) {
    try {
        const turnos = await turnosService.historialCliente(req.usuario.id, req.query);
        res.json(turnos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener historial' });
    }
}

async function cancelarCliente(req, res) {
    try {
        const { turno, previousEstado } = await turnosService.cancelarCliente(req.usuario.id, req.params.id, req.body);

        try {
            const ctx = getAuditContext(req);
            void auditLog({
                userId: req.usuario.id,
                action: 'CLIENTE_CANCELO_TURNO',
                entity: 'Turno',
                entityId: turno.id,
                status: 'SUCCESS',
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                metadata: {
                    turnoId: turno.id,
                    fechaHoraTurno: `${turno.fecha}T${turno.hora}:00.000Z`,
                    canceladoPor: 'CLIENTE',
                    liberado: true,
                    estadoAnterior: previousEstado,
                    estadoNuevo: 'disponible'
                }
            });
        } catch (e) { /* no-op */ }

        res.json({
            message: 'Turno cancelado correctamente. El horario vuelve a estar disponible.',
            turno
        });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al cancelar turno'
        });
    }
}

async function cancelarAdmin(req, res) {
    try {
        const { turno, previousEstado } = await turnosService.cancelarAdmin(req.params.id, req.body);

        try {
            const ctx = getAuditContext(req);
            void auditLog({
                userId: req.usuario?.id,
                action: 'ADMIN_CANCELO_TURNO',
                entity: 'Turno',
                entityId: turno.id,
                status: 'SUCCESS',
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                metadata: {
                    turnoId: turno.id,
                    fechaHoraTurno: `${turno.fecha}T${turno.hora}:00.000Z`,
                    canceladoPor: 'ADMIN',
                    liberado: true,
                    estadoAnterior: previousEstado,
                    estadoNuevo: 'disponible'
                }
            });
        } catch (e) { /* no-op */ }

        res.json({
            message: 'Reserva cancelada correctamente. El horario vuelve a estar disponible.',
            turno,
        });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al cancelar reserva',
        });
    }
}

async function getAdminTurnos(req, res) {
    try {
        const turnos = await turnosService.getAdminTurnos(req.query);
        res.json(turnos);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Error al listar turnos admin' });
    }
}

async function getMetrics(req, res) {
    try {
        const metrics = await turnosService.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Error al obtener métricas' });
    }
}

async function getCancelacionesAdmin(req, res) {
    try {
        const cancelaciones = await turnosService.getCancelacionesAdmin(req.query);
        res.json(cancelaciones);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Error al listar cancelaciones' });
    }
}

async function crearTurno(req, res) {
    try {
        const turno = await turnosService.crearTurno(req.body);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_CREO_TURNO',
            entity: 'turno',
            entityId: turno.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.status(201).json(turno);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al crear turno'
        });
    }
}

async function asignarTurnoAdmin(req, res) {
    try {
        const result = await turnosService.asignarTurnoAdmin(req.body);

        if (result.warnings) {
            logAdminAction({
                adminId: req.admin?.id || req.usuario?.id,
                action: 'ADMIN_ASIGNO_TURNO_CON_ADVERTENCIA',
                entity: 'turno',
                entityId: result.turno.id,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                metadata: {
                    usuarioId: req.body.usuarioId,
                    existingAppointments: result.existingAppointments?.length || 0,
                },
            });
        } else {
            logAdminAction({
                adminId: req.admin?.id || req.usuario?.id,
                action: 'ADMIN_ASIGNO_TURNO',
                entity: 'turno',
                entityId: result.turno.id,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                metadata: {
                    usuarioId: req.body.usuarioId,
                },
            });
        }

        res.status(201).json({
            message: 'Turno asignado correctamente',
            turno: result.turno,
        });
    } catch (error) {
        if (error.status === 409 && error.requiresConfirmation) {
            return res.status(409).json({
                requiresConfirmation: true,
                message: error.message,
                existingAppointments: error.existingAppointments || [],
            });
        }

        res.status(error.status || 500).json({
            message: error.message || 'Error al asignar turno',
        });
    }
}

async function generarSemana(req, res) {
    try {
        const result = await turnosService.generarSemana(req.body);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_GENERO_TURNOS',
            entity: 'turno',
            entityId: null,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                creados: result.creados,
                omitidos: result.omitidos,
            }
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al generar semana'
        });
    }
}

async function marcarCortado(req, res) {
    try {
        const turno = await turnosService.marcarCortado(req.params.id);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_MARCO_CORTADO',
            entity: 'turno',
            entityId: turno.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json(turno);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al marcar turno como cortado'
        });
    }
}

async function eliminarTurno(req, res) {
    try {
        await turnosService.eliminarTurno(req.params.id);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_ELIMINO_TURNO',
            entity: 'turno',
            entityId: parseInt(req.params.id),
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json({ message: 'Turno eliminado correctamente' });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al eliminar turno'
        });
    }
}

module.exports = {
    getDisponibles,
    reservarAnonimo,
    reservarCliente,
    historialCliente,
    cancelarCliente,
    cancelarAdmin,
    getAdminTurnos,
    getMetrics,
    getCancelacionesAdmin,
    crearTurno,
    asignarTurnoAdmin,
    generarSemana,
    marcarCortado,
    eliminarTurno
};