const prisma = require('../config/prisma');

function isUserDisabled(usuario) {
    if (!usuario) return true;

    if (Object.prototype.hasOwnProperty.call(usuario, 'deletedAt') && usuario.deletedAt) {
        return true;
    }

    if (Object.prototype.hasOwnProperty.call(usuario, 'active') && usuario.active === false) {
        return true;
    }

    if (Object.prototype.hasOwnProperty.call(usuario, 'isActive') && usuario.isActive === false) {
        return true;
    }

    return false;
}

async function adminMiddleware(req, res, next) {
    try {
        if (!req.usuario?.id) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(req.usuario.id) }
        });

        if (!usuario || isUserDisabled(usuario)) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        if (usuario.rol !== 'admin') {
            return res.status(403).json({ message: 'Acceso solo para administradores' });
        }

        req.admin = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol,
        };

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error al validar permisos de administrador' });
    }
}

module.exports = adminMiddleware;