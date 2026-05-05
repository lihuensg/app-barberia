const prisma = require('../config/prisma');
const { ENV } = require('../config/env');

const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'password_hash',
    'token',
    'accesstoken',
    'refreshtoken',
    'resettoken',
    'resetpasswordtoken',
    'authorization',
    'cookie',
    'cookies',
    'apikey',
    'apisecret',
    'secret',
    'jwt',
    'database_url',
    'resend_api_key',
    'cloudinary_api_secret',
    'body',
    'headers',
]);

const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_ITEMS = 10;
const MAX_OBJECT_KEYS = 20;
const MAX_DEPTH = 2;

function clampString(value, maxLength = MAX_STRING_LENGTH) {
    return String(value).slice(0, maxLength);
}

function sanitizeAuditMetadata(metadata, depth = 0) {
    if (metadata === null || metadata === undefined) {
        return null;
    }

    if (typeof metadata === 'string') {
        return clampString(metadata);
    }

    if (typeof metadata === 'number' || typeof metadata === 'boolean') {
        return metadata;
    }

    if (metadata instanceof Date) {
        return metadata.toISOString();
    }

    if (Array.isArray(metadata)) {
        if (depth >= MAX_DEPTH) {
            return '[Array]';
        }

        return metadata
            .slice(0, MAX_ARRAY_ITEMS)
            .map((item) => sanitizeAuditMetadata(item, depth + 1))
            .filter((item) => item !== undefined);
    }

    if (typeof metadata === 'object') {
        if (depth >= MAX_DEPTH) {
            return '[Object]';
        }

        const result = {};
        const entries = Object.entries(metadata).slice(0, MAX_OBJECT_KEYS);

        for (const [key, value] of entries) {
            const normalizedKey = String(key).toLowerCase();

            if (
                SENSITIVE_KEYS.has(normalizedKey) ||
                normalizedKey.includes('password') ||
                normalizedKey.includes('token') ||
                normalizedKey.includes('secret') ||
                normalizedKey.includes('authorization')
            ) {
                continue;
            }

            const sanitizedValue = sanitizeAuditMetadata(value, depth + 1);

            if (sanitizedValue !== undefined) {
                result[key] = sanitizedValue;
            }
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    return undefined;
}

function getAuditContext(req) {
    return {
        userId: req?.admin?.id ?? req?.usuario?.id ?? null,
        ip: req?.ip ?? null,
        userAgent: req?.headers?.['user-agent'] ?? null,
    };
}

function normalizeActionStatus(status) {
    const normalized = String(status || 'SUCCESS').toUpperCase();

    if (['SUCCESS', 'FAILED', 'BLOCKED'].includes(normalized)) {
        return normalized;
    }

    return 'SUCCESS';
}

async function auditLog({
    userId = null,
    action,
    entity,
    entityId = null,
    status = 'SUCCESS',
    ip = null,
    userAgent = null,
    metadata = null,
}) {
    if (!ENV.AUDIT_ENABLED) {
        return;
    }

    if (!action || !entity) {
        return;
    }

    try {
        await prisma.auditLog.create({
            data: {
                userId: userId || null,
                action: clampString(action, 80),
                entity: clampString(entity, 80),
                entityId: entityId ?? null,
                status: normalizeActionStatus(status),
                ip: ip ? clampString(ip, 80) : null,
                userAgent: userAgent ? clampString(userAgent, 200) : null,
                metadata: sanitizeAuditMetadata(metadata),
            },
        });
    } catch (error) {
        console.error('❌ Audit log failed:', error.message);
    }
}

module.exports = {
    auditLog,
    getAuditContext,
    sanitizeAuditMetadata,
};