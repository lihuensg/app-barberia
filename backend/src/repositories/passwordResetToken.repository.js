/**
 * Repositorio para tokens de recuperación de contraseña
 */
const prisma = require('../config/prisma');
const crypto = require('crypto');

/**
 * Hash un token plain con SHA256
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Crear un token de recuperación
 * 
 * @param {number} usuarioId - ID del usuario
 * @param {number} expiresInMinutes - Minutos hasta que expire (default: 60)
 * @returns {Object} { token: string, tokenHash: string }
 */
async function crearTokenReset(usuarioId, expiresInMinutes = 60) {
    // Generar token aleatorio (32 bytes = 64 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Guardar en base de datos
    await prisma.passwordResetToken.create({
        data: {
            usuarioId,
            tokenHash,
            expiresAt,
        },
    });

    // Retornar el token plain (nunca guardamos el plain text en DB)
    return { token, expiresAt };
}

/**
 * Validar un token de reset
 * 
 * @param {number} usuarioId - ID del usuario
 * @param {string} token - Token plain a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
async function validarTokenReset(usuarioId, token) {
    const tokenHash = hashToken(token);

    const where = { tokenHash };
    if (typeof usuarioId === 'number' && !Number.isNaN(usuarioId)) {
        where.usuarioId = usuarioId;
    }

    const resetToken = await prisma.passwordResetToken.findFirst({ where });

    // Token no existe
    if (!resetToken) {
        return {
            valid: false,
            error: 'Token inválido',
        };
    }

    // Token ya fue usado
    if (resetToken.usedAt) {
        return {
            valid: false,
            error: 'Este token de recuperación ya fue utilizado',
        };
    }

    // Token expirado
    if (new Date() > resetToken.expiresAt) {
        return {
            valid: false,
            error: 'Este token ha expirado. Solicita uno nuevo.',
        };
    }

    // Token válido
    return {
        valid: true,
        tokenId: resetToken.id,
        usuarioId: resetToken.usuarioId,
    };
}

/**
 * Marcar token como usado
 */
async function marcarTokenComoUsado(tokenId) {
    await prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
    });
}

/**
 * Obtener usuario por token (con validación)
 */
async function obtenerUsuarioPorToken(usuarioId, token) {
    let tokenToValidate = token;
    let usuarioIdToValidate = usuarioId;

    if (typeof token === 'undefined' && typeof usuarioId === 'string') {
        tokenToValidate = usuarioId;
        usuarioIdToValidate = undefined;
    }

    const validacion = await validarTokenReset(usuarioIdToValidate, tokenToValidate);

    if (!validacion.valid) {
        return {
            usuario: null,
            error: validacion.error,
        };
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id: validacion.usuarioId },
    });

    if (!usuario) {
        return {
            usuario: null,
            error: 'Usuario no encontrado',
        };
    }

    return {
        usuario,
        tokenId: validacion.tokenId,
    };
}

/**
 * Limpiar tokens expirados de un usuario
 */
async function limpiarTokensExpirados(usuarioId) {
    await prisma.passwordResetToken.deleteMany({
        where: {
            usuarioId,
            expiresAt: {
                lt: new Date(), // Menor que ahora
            },
        },
    });
}

/**
 * Limpiar tokens usados (opcional)
 */
async function limpiarTokensUsados(usuarioId) {
    await prisma.passwordResetToken.deleteMany({
        where: {
            usuarioId,
            usedAt: {
                not: null,
            },
        },
    });
}

module.exports = {
    hashToken,
    crearTokenReset,
    validarTokenReset,
    marcarTokenComoUsado,
    obtenerUsuarioPorToken,
    limpiarTokensExpirados,
    limpiarTokensUsados,
};
