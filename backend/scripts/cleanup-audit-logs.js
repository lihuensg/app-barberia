require('dotenv').config();

const prisma = require('../src/config/prisma');

async function main() {
    const retentionDays = Number.parseInt(process.env.AUDIT_RETENTION_DAYS || '90', 10);

    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
        throw new Error('AUDIT_RETENTION_DAYS debe ser un número entero positivo');
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
        where: {
            createdAt: {
                lt: cutoff,
            },
        },
    });

    console.log(`✅ Audit logs limpiados: ${result.count} registros eliminados`);
}

main()
    .catch((error) => {
        console.error('❌ Error limpiando audit logs:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });