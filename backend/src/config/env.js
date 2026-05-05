/**
 * Validación centralizada de variables de entorno
 * Se ejecuta al iniciar el servidor
 */
require('dotenv').config();

function parseBooleanEnv(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    const normalized = String(value).trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;

    throw new Error(`❌ Valor inválido para booleano: ${value}`);
}

function parsePositiveIntEnv(value, defaultValue, name) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`❌ ${name} debe ser un número entero positivo`);
    }

    return parsed;
}

const ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
    CLOUDINARY_ENABLED: process.env.CLOUDINARY_ENABLED === 'true',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'nazabarber',
    AUDIT_ENABLED: parseBooleanEnv(process.env.AUDIT_ENABLED, true),
    AUDIT_RETENTION_DAYS: parsePositiveIntEnv(process.env.AUDIT_RETENTION_DAYS, 90, 'AUDIT_RETENTION_DAYS'),
    MIN_BOOKING_NOTICE_MINUTES: parsePositiveIntEnv(process.env.MIN_BOOKING_NOTICE_MINUTES, 30, 'MIN_BOOKING_NOTICE_MINUTES'),
    CANCEL_MIN_HOURS: parsePositiveIntEnv(process.env.CANCEL_MIN_HOURS, 3, 'CANCEL_MIN_HOURS'),
};

/**
 * Lista de variables críticas que SIEMPRE deben estar presentes
 */
const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];

/**
 * Variables críticas solo en producción
 */
const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'DATABASE_URL'];

/**
 * Validar que una variable esté presente
 */
function validateRequired() {
    const missing = REQUIRED_VARS.filter(key => !ENV[key]);

    if (missing.length > 0) {
        throw new Error(
            `❌ Variables de entorno faltantes: ${missing.join(', ')}\n` +
            `Por favor, configura estas variables en tu archivo .env\n` +
            `Ver ejemplo en .env.example`
        );
    }
}

/**
 * Validar secretos en producción
 */
function validateProductionSecrets() {
    if (ENV.NODE_ENV !== 'production') return;

    const weakSecrets = [
        'secret',
        'changeme',
        '123456',
        'password',
        'admin',
        'change_me_with_a_secure_secret_min_32_chars',
        'dev_secret_key_only_for_local_development_not_for_production_replace_in_render',
    ];

    if (weakSecrets.includes(ENV.JWT_SECRET)) {
        throw new Error(
            `❌ JWT_SECRET en producción no puede ser un valor débil: "${ENV.JWT_SECRET}"\n` +
            `Usa un string largo y aleatorio (mínimo 32 caracteres)`
        );
    }

    if (ENV.JWT_SECRET.length < 32) {
        throw new Error(
            `❌ JWT_SECRET en producción debe tener mínimo 32 caracteres\n` +
            `Actual: ${ENV.JWT_SECRET.length} caracteres`
        );
    }

    if (ENV.REFRESH_TOKEN_SECRET && ENV.REFRESH_TOKEN_SECRET.length < 32) {
        throw new Error(
            `❌ REFRESH_TOKEN_SECRET en producción debe tener mínimo 32 caracteres\n` +
            `Actual: ${ENV.REFRESH_TOKEN_SECRET.length} caracteres`
        );
    }
}

/**
 * Validar URLs en producción
 */
function validateProductionUrls() {
    if (ENV.NODE_ENV !== 'production') return;

    if (!ENV.FRONTEND_URL || ENV.FRONTEND_URL === 'http://localhost:5173') {
        throw new Error(
            `❌ FRONTEND_URL en producción no puede ser localhost\n` +
            `Configura la URL real de tu frontend en Vercel`
        );
    }

    if (!ENV.BACKEND_URL || ENV.BACKEND_URL === 'http://localhost:3000') {
        throw new Error(
            `❌ BACKEND_URL en producción no puede ser localhost\n` +
            `Configura la URL real de tu backend en Render`
        );
    }
}

/**
 * Validar Cloudinary en producción si está habilitado
 */
function validateCloudinary() {
    if (!ENV.CLOUDINARY_ENABLED) return;

    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(key => !ENV[key]);

    if (missing.length > 0) {
        throw new Error(
            `❌ Cloudinary está habilitado pero faltan variables:\n${missing.join(', ')}\n` +
            `Desactiva CLOUDINARY_ENABLED=false o configura credenciales en .env`
        );
    }
}

function validateAuditSettings() {
    if (!Number.isInteger(ENV.AUDIT_RETENTION_DAYS) || ENV.AUDIT_RETENTION_DAYS <= 0) {
        throw new Error('❌ AUDIT_RETENTION_DAYS debe ser un número entero positivo');
    }
}

function validateBusinessSettings() {
    if (!Number.isInteger(ENV.MIN_BOOKING_NOTICE_MINUTES) || ENV.MIN_BOOKING_NOTICE_MINUTES <= 0) {
        throw new Error('❌ MIN_BOOKING_NOTICE_MINUTES debe ser un número entero positivo');
    }

    if (!Number.isInteger(ENV.CANCEL_MIN_HOURS) || ENV.CANCEL_MIN_HOURS <= 0) {
        throw new Error('❌ CANCEL_MIN_HOURS debe ser un número entero positivo');
    }
}

/**
 * Ejecutar todas las validaciones
 */
function validate() {
    try {
        validateRequired();
        validateProductionSecrets();
        validateProductionUrls();
        validateCloudinary();
        validateAuditSettings();
        validateBusinessSettings();

        console.log('✅ Variables de entorno validadas correctamente');
        return true;
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    validate,
    ENV,
};
