const authService = require('../services/auth.service');
const { logAdminAction } = require('../utils/adminAudit');
const { auditLog, getAuditContext } = require('../services/audit.service');

async function registrar(req, res) {
    try {
        const result = await authService.registrar(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al registrar usuario'
        });
    }
}

async function login(req, res) {
    try {
        const result = await authService.login(req.body);

        if (result?.usuario?.rol === 'admin') {
            logAdminAction({
                adminId: result.usuario.id,
                action: 'ADMIN_LOGIN',
                entity: 'auth',
                entityId: result.usuario.id,
                ip: req.ip,
                userAgent: req.get('user-agent'),
            });
        }

        res.json(result);
    } catch (error) {
        // Registrar intento de login fallido (no bloquear respuesta)
        if (error && error.status === 401) {
            try {
                const email = req.body?.email;
                const emailDomain = email && typeof email === 'string' && email.includes('@') ? email.split('@')[1] : null;
                const ctx = getAuditContext(req);
                void auditLog({
                    userId: null,
                    action: 'LOGIN_FAILED',
                    entity: 'Auth',
                    status: 'FAILED',
                    ip: ctx.ip,
                    userAgent: ctx.userAgent,
                    metadata: { emailDomain }
                });
            } catch (e) {
                // no-op
            }
        }
        res.status(error.status || 500).json({
            message: error.message || 'Error al iniciar sesión'
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const result = await authService.forgotPassword(req.body);
        // Siempre retorna 200 con mensaje genérico (no revelar si email existe)
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al procesar solicitud'
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const result = await authService.resetPassword({
            token,
            newPassword
        });
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al recuperar contraseña'
        });
    }
}

module.exports = {
    registrar,
    login,
    forgotPassword,
    resetPassword
};