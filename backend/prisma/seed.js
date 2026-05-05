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

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.usuario.upsert({
        where: {
            email: 'admin@nazabarber.com'
        },
        update: {
            nombre: 'Naza Barber',
            passwordHash,
            telefono: '3430000000',
            instagram: '@nazabarber',
            rol: 'admin',
            bio: 'Barbería profesional. Cortes modernos, perfilados y estilo urbano.',
            whatsapp: '3430000000'
        },
        create: {
            nombre: 'Naza Barber',
            email: 'admin@nazabarber.com',
            passwordHash,
            telefono: '3430000000',
            instagram: '@nazabarber',
            rol: 'admin',
            bio: 'Barbería profesional. Cortes modernos, perfilados y estilo urbano.',
            whatsapp: '3430000000'
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