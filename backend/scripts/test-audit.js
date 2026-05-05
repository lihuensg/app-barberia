require('dotenv').config();

const prisma = require('../src/config/prisma');
const { auditLog } = require('../src/services/audit.service');
const { ENV } = require('../src/config/env');

async function main() {
    console.log('AUDIT_ENABLED:', ENV.AUDIT_ENABLED);

    try {
        await auditLog({
            userId: 99999,
            action: 'TEST_AUDIT_CREATE',
            entity: 'Test',
            entityId: 123,
            status: 'SUCCESS',
            ip: '127.0.0.1',
            userAgent: 'test-agent/1.0',
            metadata: { note: 'Prueba de auditoría ligera', small: true }
        });

        const last = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        console.log('Último AuditLog insertado:');
        console.log(JSON.stringify(last, null, 2));
    } catch (error) {
        console.error('Error en prueba de auditoría:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
