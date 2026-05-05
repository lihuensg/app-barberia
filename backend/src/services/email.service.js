/**
 * Servicio de emails transaccionales con Resend
 * Maneja el envío de emails de recuperación de contraseña
 */
const { Resend } = require('resend');
const { resendConfig } = require('../config/resend');

// Instancia de Resend
let resend = null;

function initializeResendClient() {
    if (!resendConfig.apiKey) {
        console.warn('⚠️  Resend no está configurado (RESEND_API_KEY vacía)');
        return null;
    }

    try {
        resend = new Resend(resendConfig.apiKey);
        return resend;
    } catch (error) {
        console.error('❌ Error inicializando Resend:', error);
        return null;
    }
}

/**
 * Enviar email de recuperación de contraseña
 * 
 * @param {Object} params
 * @param {string} params.to - Email del usuario
 * @param {string} params.resetUrl - URL completa para recuperar contraseña
 * @param {string} params.nombre - Nombre del usuario (opcional)
 */
async function sendPasswordResetEmail({ to, resetUrl, nombre = 'Usuario' }) {
    // Si Resend no está configurado, loguear pero no fallar
    if (!resendConfig.apiKey) {
        console.log('📧 [DEV MODE] Email de recuperación (no enviado):', {
            to,
            resetUrl,
            mailFrom: resendConfig.mailFrom,
        });
        return { success: true, message: 'Email simulado (Resend no configurado)' };
    }

    try {
        // Inicializar Resend si no está inicializado
        if (!resend) {
            initializeResendClient();
        }

        if (!resend) {
            throw new Error('Resend no está disponible');
        }

        // HTML del email
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1a1a1a;
            margin: 0;
            font-size: 24px;
        }
        .content {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            padding: 12px 30px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #333333;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
        }
        .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧔 NazaBarber</h1>
            <p>Recupera tu contraseña</p>
        </div>
        
        <div class="content">
            <p>Hola ${nombre},</p>
            
            <p>Recibimos una solicitud para recuperar tu contraseña en NazaBarber. Si fuiste tú, haz clic en el botón de abajo para establecer una nueva contraseña.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Recuperar Contraseña</a>
            </div>
            
            <p>Este link expira en 1 hora por razones de seguridad.</p>
            
            <div class="warning">
                <strong>⚠️ Si no solicitaste recuperar tu contraseña,</strong> ignora este email. Tu cuenta está segura.
            </div>
            
            <p>Si el botón no funciona, copia y pega este link en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${resetUrl}
            </p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} NazaBarber. Todos los derechos reservados.</p>
            <p>Este es un email automático. Por favor no respondas a este correo.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Enviar email con Resend
        const response = await resend.emails.send({
            from: resendConfig.mailFrom,
            to: to,
            subject: '🧔 Recupera tu contraseña en NazaBarber',
            html: htmlContent,
        });

        if (response.error) {
            console.error('❌ Error al enviar email:', response.error);
            return {
                success: false,
                error: response.error,
            };
        }

        console.log('✅ Email de recuperación enviado:', {
            to,
            messageId: response.data?.id,
        });

        return {
            success: true,
            messageId: response.data?.id,
        };
    } catch (error) {
        console.error('❌ Error en sendPasswordResetEmail:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Email de confirmación de contraseña cambiada (opcional)
 */
async function sendPasswordChangedEmail({ to, nombre = 'Usuario' }) {
    if (!resendConfig.apiKey) {
        console.log('📧 [DEV MODE] Email de confirmación de cambio (no enviado):', { to });
        return { success: true };
    }

    try {
        if (!resend) {
            initializeResendClient();
        }

        if (!resend) {
            throw new Error('Resend no está disponible');
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 24px; }
        .content { color: #666; line-height: 1.6; }
        .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧔 NazaBarber</h1>
            <p>Contraseña actualizada</p>
        </div>
        <div class="content">
            <p>Hola ${nombre},</p>
            <div class="success">
                <strong>✅ Tu contraseña ha sido cambiada exitosamente.</strong>
            </div>
            <p>Si no fuiste tú quien hizo este cambio, contáctanos inmediatamente.</p>
        </div>
    </div>
</body>
</html>
        `;

        const response = await resend.emails.send({
            from: resendConfig.mailFrom,
            to: to,
            subject: '✅ Tu contraseña en NazaBarber ha sido actualizada',
            html: htmlContent,
        });

        return {
            success: !response.error,
            messageId: response.data?.id,
        };
    } catch (error) {
        console.error('❌ Error en sendPasswordChangedEmail:', error);
        return { success: false };
    }
}

module.exports = {
    initializeResendClient,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
};
