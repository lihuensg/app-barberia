const { auditLog } = require('../services/audit.service');

function logAdminAction({ adminId, action, entity, entityId = null, ip = null, userAgent = null, metadata = null }) {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            adminId,
            action,
            entity,
            entityId,
            ip,
            userAgent,
            metadata,
        };

        // Console audit for debugging (non-production)
        if (process.env.NODE_ENV !== 'production') {
            console.log('[ADMIN_AUDIT]', JSON.stringify(payload));
        }

        // Also try to persist a lightweight audit record (non-blocking)
        void auditLog({
            userId: adminId || null,
            action,
            entity,
            entityId: entityId ?? null,
            status: 'SUCCESS',
            ip: ip || null,
            userAgent: userAgent || null,
            metadata: metadata || null,
        }).catch(() => { /* no-op: fallar la auditoría no rompe la app */ });
    } catch (error) {
        // El logging no debe romper el flujo principal
    }
}

module.exports = {
    logAdminAction,
};