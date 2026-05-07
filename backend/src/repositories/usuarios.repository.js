const prisma = require('../config/prisma');

async function buscarPorEmail(email) {
    return prisma.usuario.findUnique({
        where: { email }
    });
}

async function buscarPorId(id) {
    return prisma.usuario.findUnique({
        where: { id: parseInt(id) }
    });
}

async function crearCliente({ nombre, email, passwordHash, whatsapp, telefono, instagram }) {
    return prisma.usuario.create({
        data: {
            nombre,
            email,
            passwordHash,
            // Guardamos whatsapp en el campo dedicado; conservar telefono si viene (deprecated)
            whatsapp: whatsapp || telefono || undefined,
            telefono: telefono || undefined,
            instagram: instagram || undefined,
            rol: 'cliente'
        }
    });
}

async function actualizarPerfil(id, { nombre, telefono, instagram }) {
    return prisma.usuario.update({
        where: { id: parseInt(id) },
        data: {
            nombre: nombre || undefined,
            telefono: telefono || undefined,
            instagram: instagram || undefined,
            // Permitir que el admin guarde campo whatsapp si existe en el schema
            whatsapp: arguments[1] && arguments[1].whatsapp !== undefined ? arguments[1].whatsapp : undefined
        }
    });
}

async function actualizarFoto(id, fotoUrl, photoPublicId) {
    return prisma.usuario.update({
        where: { id: parseInt(id) },
        data: {
            foto: fotoUrl,
            photoPublicId: photoPublicId || undefined
        }
    });
}

async function obtenerAdminPublico() {
    return prisma.usuario.findFirst({
        where: { rol: 'admin' },
        orderBy: { id: 'asc' },
        select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            foto: true,
            bio: true,
            instagram: true,
            whatsapp: true
        }
    });
}

async function listarClientes({ search, page = 1, limit = 20 }) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const clientes = await prisma.usuario.findMany({
        where: {
            rol: 'cliente',
            ...(search ? {
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { telefono: { contains: search, mode: 'insensitive' } },
                    { instagram: { contains: search, mode: 'insensitive' } }
                ]
            } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
        select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            instagram: true,
            foto: true,
            createdAt: true,
            _count: { select: { turnos: true } }
        }
    });

    return clientes.map(c => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        instagram: c.instagram,
        foto: c.foto,
        totalTurnos: c._count.turnos
    }));
}

async function actualizarPassword(id, passwordHash) {
    return prisma.usuario.update({
        where: { id: parseInt(id) },
        data: {
            passwordHash
        }
    });
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    crearCliente,
    actualizarPerfil,
    actualizarFoto,
    actualizarPassword,
    obtenerAdminPublico,
    listarClientes
};