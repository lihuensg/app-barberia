const prisma = require('../config/prisma');
const { ENV } = require('../config/env');

/**
 * GET /api/admin/audit-logs
 * Query: page, limit, action, entity, userId, fechaDesde, fechaHasta
 */
async function getAuditLogs(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        let limit = parseInt(req.query.limit || '20', 10);
        if (!Number.isInteger(limit) || limit <= 0) limit = 20;
        limit = Math.min(limit, 50);

        const where = {};

        if (req.query.action) where.action = String(req.query.action);
        if (req.query.entity) where.entity = String(req.query.entity);
        if (req.query.userId) where.userId = parseInt(req.query.userId, 10) || undefined;

        if (req.query.fechaDesde || req.query.fechaHasta) {
            where.createdAt = {};
            if (req.query.fechaDesde) {
                const d = new Date(req.query.fechaDesde);
                if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
            }
            if (req.query.fechaHasta) {
                const d = new Date(req.query.fechaHasta);
                if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
            }
        }

        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit })
        ]);

        res.json({ page, limit, total, items });
    } catch (error) {
        console.error('❌ Error getAuditLogs:', error.message || error);
        res.status(500).json({ message: 'Error al obtener audit logs' });
    }
}

module.exports = {
    getAuditLogs
};
