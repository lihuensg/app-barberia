const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

function getAdminSeedConfig() {
    const isProduction = process.env.NODE_ENV === 'production';

    const email = (process.env.ADMIN_EMAIL || 'admin@nazabarber.com').trim().toLowerCase();
    const passwordFromEnv = process.env.ADMIN_PASSWORD;
    const password = passwordFromEnv && passwordFromEnv.trim().length > 0
        ? passwordFromEnv
        : 'admin12345';

    if (isProduction) {
        if (!passwordFromEnv || passwordFromEnv.trim().length === 0) {
            throw new Error(
                'ADMIN_PASSWORD es obligatoria en producción para ejecutar seed de admin.'
            );
        }

        if (passwordFromEnv.length < 12) {
            throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres en producción.');
        }
    }

    return {
        email,
        password,
        nombre: process.env.ADMIN_NOMBRE || 'Naza Barber',
        telefono: process.env.ADMIN_TELEFONO || '3430000000',
        instagram: process.env.ADMIN_INSTAGRAM || '@nazabarber',
        bio: process.env.ADMIN_BIO || 'Barbería profesional. Cortes modernos, perfilados y estilo urbano.',
        whatsapp: process.env.ADMIN_WHATSAPP || '3430000000',
    };
}

async function main() {
    const adminConfig = getAdminSeedConfig();
    const passwordHash = await bcrypt.hash(adminConfig.password, 10);

    const admin = await prisma.usuario.upsert({
        where: {
            email: adminConfig.email
        },
        update: {
            nombre: adminConfig.nombre,
            passwordHash,
            telefono: adminConfig.telefono,
            instagram: adminConfig.instagram,
            rol: 'admin',
            bio: adminConfig.bio,
            whatsapp: adminConfig.whatsapp
        },
        create: {
            nombre: adminConfig.nombre,
            email: adminConfig.email,
            passwordHash,
            telefono: adminConfig.telefono,
            instagram: adminConfig.instagram,
            rol: 'admin',
            bio: adminConfig.bio,
            whatsapp: adminConfig.whatsapp
        }
    });

    console.log('Admin creado o actualizado correctamente:');
    console.log({
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol
    });
}

main()
    .catch((error) => {
        console.error('Error creando admin:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });