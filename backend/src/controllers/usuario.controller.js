const usuarioService = require('../services/usuario.service');
const { logAdminAction } = require('../utils/adminAudit');

async function getMe(req, res) {
    try {
        const usuario = await usuarioService.getMe(req.usuario.id);
        res.json(usuario);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al obtener perfil'
        });
    }
}

async function updateMe(req, res) {
    try {
        const usuario = await usuarioService.updateMe(req.usuario.id, req.body);
        res.json(usuario);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al actualizar perfil'
        });
    }
}

async function subirFoto(req, res) {
    try {
        // Puede venir como JSON { foto: url } o como multipart con file en req.file
        const usuario = await usuarioService.subirFoto(req.usuario.id, req.body.foto, req.file);
        res.json(usuario);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al subir foto'
        });
    }
}

async function getAdminPublico(req, res) {
    try {
        const admin = await usuarioService.getAdminPublico();
        res.json(admin);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener datos públicos del admin'
        });
    }
}

async function getClientes(req, res) {
    try {
        const clientes = await usuarioService.getClientes(req.query);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_LISTO_CLIENTES',
            entity: 'usuario',
            entityId: null,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                total: Array.isArray(clientes) ? clientes.length : 0,
                search: req.query.search || null,
                page: req.query.page,
                limit: req.query.limit,
            }
        });
        res.json(clientes);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Error al listar clientes' });
    }
}

module.exports = {
    getMe,
    updateMe,
    subirFoto,
    getAdminPublico,
    getClientes
};