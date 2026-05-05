const redsocialService = require('../services/redsocial.service');
const { logAdminAction } = require('../utils/adminAudit');

const { uploadBuffer, CLOUDINARY_ENABLED } = require('../config/cloudinary');

async function getPosts(req, res) {
    try {
        const usuarioId = req.usuario?.id ?? null;
        const posts = await redsocialService.getPosts(usuarioId, req.query);
        res.json(posts);
    } catch (error) {
        console.error('❌ Error en getPosts:', error);
        res.status(500).json({ message: 'Error al obtener posts' });
    }
}

async function crearPost(req, res) {
    try {
        const post = await redsocialService.crearPost(req.usuario.id, req.body);
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_CREO_POST',
            entity: 'post',
            entityId: post.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al crear post'
        });
    }
}

async function toggleLike(req, res) {
    try {
        const result = await redsocialService.toggleLike(req.usuario.id, parseInt(req.params.postId));
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al dar like'
        });
    }
}

async function comentarPost(req, res) {
    try {
        const comentario = await redsocialService.comentarPost(req.usuario.id, parseInt(req.params.postId), req.body);
        res.status(201).json(comentario);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al comentar'
        });
    }
}

async function eliminarPost(req, res) {
    try {
        await redsocialService.eliminarPost(parseInt(req.params.postId));
        logAdminAction({
            adminId: req.admin?.id || req.usuario?.id,
            action: 'ADMIN_ELIMINO_POST',
            entity: 'post',
            entityId: parseInt(req.params.postId),
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.json({ message: 'Post eliminado correctamente' });
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al eliminar post'
        });
    }
}

async function uploadPostImage(req, res) {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'Archivo no recibido' });
        }

        if (!CLOUDINARY_ENABLED) {
            return res.status(400).json({ message: 'Uploads deshabilitados en este entorno' });
        }

        const result = await uploadBuffer(req.file.buffer, { folder: 'posts' });

        res.status(201).json({ imageUrl: result.secure_url, imagePublicId: result.public_id });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir imagen' });
    }
}

async function eliminarComentario(req, res) {
    try {
        const isAdmin = req.admin ? true : false;
        const result = await redsocialService.eliminarComentario(
            req.usuario.id,
            parseInt(req.params.comentarioId),
            isAdmin
        );
        res.json(result);
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Error al eliminar comentario'
        });
    }
}

module.exports = {
    getPosts,
    crearPost,
    toggleLike,
    comentarPost,
    eliminarPost,
    uploadPostImage,
    eliminarComentario
};