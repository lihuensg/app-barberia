/**
 * Configuración de Resend para envío de emails transaccionales
 * https://resend.com/docs
 */
const { ENV } = require('./env');

const resendConfig = {
    apiKey: process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM || 'NazaBarber <onboarding@resend.dev>',
    enabled: !!process.env.RESEND_API_KEY,
};

/**
 * Inicializar Resend si está habilitado
 */
function initializeResend() {
    if (!resendConfig.apiKey) {
        console.log('ℹ️  Resend: No configurado (RESEND_API_KEY no está presente)');
        return false;
    }

    try {
        // Aquí se importaría y configurar Resend package
        // const { Resend } = require('resend');
        // const resend = new Resend(resendConfig.apiKey);
        // console.log('✅ Resend configurado correctamente');
        console.log('ℹ️  Resend: Listo para usar (apiKey configurada)');
        return true;
    } catch (error) {
        console.error('❌ Error al configurar Resend:', error.message);
        return false;
    }
}

/**
 * Validar que Resend esté disponible si hay RESEND_API_KEY
 */
function validateResendSetup() {
    if (!resendConfig.apiKey) {
        return {
            valid: true,
            message: 'Resend no configurado (RESEND_API_KEY vacía)',
        };
    }

    if (!resendConfig.mailFrom) {
        return {
            valid: false,
            message: 'Resend habilitado pero MAIL_FROM no está configurado',
        };
    }

    return {
        valid: true,
        message: 'Resend configurado correctamente',
    };
}

module.exports = {
    resendConfig,
    initializeResend,
    validateResendSetup,
};
