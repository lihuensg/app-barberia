const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');
const passwordResetTokenRepository = require('../repositories/passwordResetToken.repository');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('./email.service');
const { auditLog } = require('./audit.service');

function generarToken(usuario) {
    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
}

function limpiarUsuario(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        instagram: usuario.instagram,
        foto: usuario.foto,
        rol: usuario.rol,
        bio: usuario.bio,
        whatsapp: usuario.whatsapp,
        whatsappNormalizado: (function(){
            try { const { normalizeTelefono } = require('../utils/turnosBusiness'); return normalizeTelefono(usuario.whatsapp || usuario.telefono || null); } catch(e){ return null }
        })()
    };
}

async function registrar(data) {
    const { nombre, email, password, whatsapp, telefono, instagram } = data;

    if (!nombre || !email || !password || !(whatsapp || telefono)) {
        const error = new Error('El nombre, el email, la contraseña y el WhatsApp son obligatorios.');
        error.status = 400;
        throw error;
    }

    const existe = await usuariosRepository.buscarPorEmail(email);

    if (existe) {
        const error = new Error('Ya existe una cuenta con este email.');
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Prefer `whatsapp` field; for backward compatibility accept `telefono` if whatsapp missing
    const whatsappToSave = whatsapp || telefono || undefined;

    const usuario = await usuariosRepository.crearCliente({
        nombre,
        email,
        passwordHash,
        whatsapp: whatsappToSave,
        instagram: undefined // no instagram for public registration
    });

    const usuarioLimpio = limpiarUsuario(usuario);
    const token = generarToken(usuarioLimpio);

    return {
        token,
        usuario: usuarioLimpio
    };
}

async function login(data) {
    const { email, password } = data;

    if (!email || !password) {
        const error = new Error('El email y la contraseña son obligatorios.');
        error.status = 400;
        throw error;
    }

    const usuario = await usuariosRepository.buscarPorEmail(email);

    if (!usuario) {
        const error = new Error('Email o contraseña incorrectos.');
        error.status = 401;
        throw error;
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordOk) {
        const error = new Error('Email o contraseña incorrectos.');
        error.status = 401;
        throw error;
    }

    const usuarioLimpio = limpiarUsuario(usuario);
    const token = generarToken(usuarioLimpio);

    return {
        token,
        usuario: usuarioLimpio
    };
}

/**
 * Solicitar recuperación de contraseña
 * NO revelar si el email existe o no
 */
async function forgotPassword(data) {
    const { email } = data;

    if (!email) {
        const error = new Error('El email es obligatorio.');
        error.status = 400;
        throw error;
    }

    // Buscar usuario (sin revelar si existe o no)
    const usuario = await usuariosRepository.buscarPorEmail(email);

    // Respuesta genérica siempre
    const respuestaGenerica = {
        message: 'Si el email está registrado, te enviaremos las instrucciones para recuperar tu contraseña.'
    };

    if (!usuario) {
        // Email no existe: retornar mensaje genérico
        // (no hacemos nada más, por seguridad)
        return respuestaGenerica;
    }

    try {
        // Crear token de reset
        const { token, expiresAt } = await passwordResetTokenRepository.crearTokenReset(usuario.id, 60); // 60 minutos

        // Construir URL de reset
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/restablecer/${token}?userId=${usuario.id}`;

        // Enviar email
        const emailResult = await sendPasswordResetEmail({
            to: usuario.email,
            resetUrl,
            nombre: usuario.nombre,
        });

        if (!emailResult.success) {
            console.warn('⚠️  Fallo al enviar email de recuperación:', emailResult.error);
            // Aún retornamos el mensaje genérico
        }

        // Auditar solicitud de reset (ligera, sin guardar email completo)
        try {
            const emailDomain = usuario.email && usuario.email.includes('@') ? usuario.email.split('@')[1] : null;
            void auditLog({
                userId: usuario.id,
                action: 'PASSWORD_RESET_REQUESTED',
                entity: 'Auth',
                status: 'SUCCESS',
                metadata: { emailDomain }
            });
        } catch (e) {
            // no-op
        }

        // Siempre retornar mensaje genérico
        return respuestaGenerica;
    } catch (error) {
        console.error('❌ Error en forgotPassword:', error);
        // Retornar mensaje genérico incluso si hay error
        return respuestaGenerica;
    }
}

/**
 * Recuperar contraseña con token
 */
async function resetPassword(data) {
    const { token, newPassword } = data;

    if (!token || !newPassword) {
        const error = new Error('El enlace para cambiar la contraseña no es válido.');
        error.status = 400;
        throw error;
    }

    if (newPassword.length < 8) {
        const error = new Error('La contraseña debe tener al menos 8 caracteres');
        error.status = 400;
        throw error;
    }

    try {
        // Validar token y obtener usuario
        const { usuario, tokenId, error: tokenError } = await passwordResetTokenRepository.obtenerUsuarioPorToken(token);

        if (!usuario) {
            // Auditar intento fallido de reset
            try {
                void auditLog({
                    userId: null,
                    action: 'PASSWORD_RESET_FAILED',
                    entity: 'Auth',
                    status: 'FAILED',
                    metadata: { reason: tokenError || 'token_invalid' }
                });
            } catch (e) { /* no-op */ }

            const normalized = String(tokenError || '').toLowerCase();
            const friendlyTokenMessage =
                normalized.includes('expir')
                    ? 'El enlace para cambiar la contraseña venció. Solicitá uno nuevo.'
                    : 'El enlace no es válido o ya fue utilizado.';

            const error = new Error(friendlyTokenMessage);
            error.status = 401;
            throw error;
        }

        // Hash la nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña en base de datos
        await usuariosRepository.actualizarPassword(usuario.id, passwordHash);

        // Marcar token como usado
        await passwordResetTokenRepository.marcarTokenComoUsado(tokenId);

        // Enviar email de confirmación
        await sendPasswordChangedEmail({
            to: usuario.email,
            nombre: usuario.nombre,
        });

        // Auditar reset exitoso
        try {
            void auditLog({
                userId: usuario.id,
                action: 'PASSWORD_RESET_SUCCESS',
                entity: 'Auth',
                status: 'SUCCESS'
            });
        } catch (e) { /* no-op */ }

        return {
            message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.'
        };
    } catch (error) {
        if (error.status) {
            throw error;
        }

        console.error('❌ Error en resetPassword:', error);

        const err = new Error('Error al recuperar contraseña');
        err.status = 500;
        throw err;
    }
}

module.exports = {
    generarToken,
    limpiarUsuario,
    registrar,
    login,
    forgotPassword,
    resetPassword
};