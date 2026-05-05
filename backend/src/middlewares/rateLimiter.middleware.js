/**
 * Rate limiting para endpoints de autenticación
 * Protege contra ataques de fuerza bruta
 */
const rateLimit = require('express-rate-limit');

/**
 * Rate limit para login por IP:
 * - Máximo 10 intentos cada 15 minutos por IP (de cualquier email)
 */
const loginLimiterByIP = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos totales
    message: {
        message: 'Demasiados intentos de login desde tu IP. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        // Limitar por IP
        return req.ip || req.connection.remoteAddress;
    }
});

/**
 * Rate limit para login por EMAIL:
 * - Máximo 5 intentos cada 15 minutos del MISMO email
 */
const loginLimiterByEmail = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos del mismo email
    message: {
        message: 'Demasiados intentos con este email. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req, res) => {
        // Solo limitar si hay email en el body
        return !req.body?.email;
    },
    keyGenerator: (req, res) => {
        // Limitar por EMAIL (no por IP)
        return `email-${(req.body?.email || '').toLowerCase()}`;
    }
});

/**
 * Middleware que aplica ambos limiters de login
 * Si falla alguno, bloquea la request
 */
const loginLimiter = (req, res, next) => {
    // Primero aplicar limiter por IP
    loginLimiterByIP(req, res, (err1) => {
        if (err1) return next(err1);
        // Luego aplicar limiter por email
        loginLimiterByEmail(req, res, (err2) => {
            if (err2) return next(err2);
            next();
        });
    });
};

/**
 * Rate limit para registro:
 * - Máximo 10 registros cada hora por IP
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 intentos
    message: {
        message: 'Demasiados registros. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
});

/**
 * Rate limit para forgot password:
 * - Máximo 5 intentos cada 30 minutos por IP (de cualquier email)
 */
const forgotPasswordLimiterByIP = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutos
    max: 5, // 5 intentos totales
    message: {
        message: 'Demasiados intentos desde tu IP. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
});

/**
 * Rate limit para forgot password por EMAIL:
 * - Máximo 3 intentos cada 30 minutos del MISMO email
 */
const forgotPasswordLimiterByEmail = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutos
    max: 3, // 3 intentos del mismo email
    message: {
        message: 'Demasiados intentos con este email. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req, res) => {
        // Solo limitar si hay email en el body
        return !req.body?.email;
    },
    keyGenerator: (req, res) => {
        // Limitar por EMAIL (no por IP)
        return `forgot-email-${(req.body?.email || '').toLowerCase()}`;
    }
});

/**
 * Middleware que aplica ambos limiters de forgot password
 * Si falla alguno, bloquea la request
 */
const forgotPasswordLimiter = (req, res, next) => {
    // Primero aplicar limiter por IP
    forgotPasswordLimiterByIP(req, res, (err1) => {
        if (err1) return next(err1);
        // Luego aplicar limiter por email
        forgotPasswordLimiterByEmail(req, res, (err2) => {
            if (err2) return next(err2);
            next();
        });
    });
};

function adminKey(prefix, req) {
    const adminId = req.usuario?.id ? `admin-${req.usuario.id}` : 'admin-anon';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
    return `${prefix}-${adminId}-${ip}`;
}

const adminGenerarSemanaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        message: 'Demasiadas solicitudes para generar semana. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => adminKey('admin-generar-semana', req),
});

const adminCrearPostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: 'Demasiadas solicitudes para crear posts. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => adminKey('admin-crear-post', req),
});

const adminEliminarLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        message: 'Demasiadas solicitudes de eliminación. Probá nuevamente más tarde.'
    },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => adminKey('admin-eliminar', req),
});

/**
 * Rate limit para comentarios: 10 comentarios por 10 minutos por usuario o IP
 */
const commentsLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10,
    message: { message: 'Demasiadas acciones. Probá nuevamente más tarde.' },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.usuario?.id ? `user-${req.usuario.id}` : (req.ip || req.connection.remoteAddress || 'anon');
    }
});

/**
 * Rate limit para likes/toggles: 60 acciones por 10 minutos por usuario o IP
 */
const likesLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 60,
    message: { message: 'Demasiadas acciones. Probá nuevamente más tarde.' },
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.usuario?.id ? `user-${req.usuario.id}` : (req.ip || req.connection.remoteAddress || 'anon');
    }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    adminGenerarSemanaLimiter,
    adminCrearPostLimiter,
    adminEliminarLimiter,
    commentsLimiter,
    likesLimiter,
};
