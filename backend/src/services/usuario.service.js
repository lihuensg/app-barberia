const usuariosRepository = require('../repositories/usuarios.repository');
const { sanitizeUser, sanitizeUsers } = require('../utils/sanitize');

async function getMe(usuarioId) {
    const usuario = await usuariosRepository.buscarPorId(usuarioId);

    if (!usuario) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    }

    return sanitizeUser(usuario);
}

async function updateMe(usuarioId, data) {
    const { nombre, telefono, instagram, whatsapp } = data;

    const usuario = await usuariosRepository.actualizarPerfil(usuarioId, {
        nombre,
        whatsapp,
        telefono,
        instagram,
    });

    return sanitizeUser(usuario);
}

async function subirFoto(usuarioId, fotoUrl, file) {
    // Si viene file (multipart), subir a Cloudinary
    const { uploadBuffer, CLOUDINARY_ENABLED, CLOUDINARY_FOLDER, deleteImage } = require('../config/cloudinary');

    if (file && file.buffer) {
        if (!CLOUDINARY_ENABLED) {
            const error = new Error('Subidas de archivos no habilitadas en este entorno');
            error.status = 400;
            throw error;
        }

        // Obtener usuario anterior para eliminar imagen vieja si existe
        const usuarioAnterior = await usuariosRepository.buscarPorId(usuarioId);

        // Subir y guardar URL + publicId
        const folder = 'profiles';
        const result = await uploadBuffer(file.buffer, { folder });

        // Eliminar imagen anterior si existe
        if (usuarioAnterior && usuarioAnterior.photoPublicId) {
            try {
                await deleteImage(usuarioAnterior.photoPublicId);
            } catch (err) {
                // Log pero no fallar si no se puede eliminar la antigua
                console.warn(`⚠️  No se pudo eliminar foto anterior (${usuarioAnterior.photoPublicId}):`, err.message);
            }
        }

        const usuario = await usuariosRepository.actualizarFoto(usuarioId, result.secure_url, result.public_id);

        return sanitizeUser(usuario);
    }

    // Si viene URL en body
    if (!fotoUrl) {
        const error = new Error('La URL de la foto es obligatoria');
        error.status = 400;
        throw error;
    }

    // Si Cloudinary está habilitado, preferimos URLs de Cloudinary
    if (CLOUDINARY_ENABLED && !String(fotoUrl).includes('res.cloudinary.com')) {
        const error = new Error('La URL de la foto debe ser de Cloudinary en este entorno');
        error.status = 400;
        throw error;
    }

    const usuario = await usuariosRepository.actualizarFoto(usuarioId, fotoUrl);

    return sanitizeUser(usuario);
}

async function getAdminPublico() {
    const admin = await usuariosRepository.obtenerAdminPublico();

    if (!admin) return null;

    const { normalizeTelefono } = require('../utils/turnosBusiness');
    const telef = admin.whatsapp || admin.telefono || null;
    const whatsappNormalizado = normalizeTelefono(telef);

    return {
        nombre: admin.nombre || null,
        email: admin.email || null,
        telefono: admin.telefono || null,
        whatsapp: admin.whatsapp || null,
        instagram: admin.instagram || null,
        foto: admin.foto || null,
        whatsappNormalizado: whatsappNormalizado || null,
    };
}

async function getClientes({ search, page, limit }) {
    const clientes = await usuariosRepository.listarClientes({ search, page, limit });

    return sanitizeUsers(clientes);
}

module.exports = {
    getMe,
    updateMe,
    subirFoto,
    getAdminPublico,
    getClientes
};