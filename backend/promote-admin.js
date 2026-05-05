/**
 * Promover usuario a admin
 */
const prisma = require('./src/config/prisma');

async function promoteToAdmin() {
    console.log('🔐 Promoviendo usuario a admin...\n');

    const user = await prisma.usuario.update({
        where: { email: 'admin@test.com' },
        data: { rol: 'admin' }
    });

    console.log(`✅ Usuario ${user.email} ahora tiene rol: ${user.rol}`);
    process.exit(0);
}

promoteToAdmin().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
