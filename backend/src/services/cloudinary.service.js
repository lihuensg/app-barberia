/**
 * Servicio de alto nivel para operaciones con Cloudinary
 * Utiliza las funciones de configuración en ../config/cloudinary.js
 */
const { CLOUDINARY_ENABLED, CLOUDINARY_FOLDER, uploadBuffer, deleteImage } = require('../config/cloudinary');

async function uploadBufferToCloudinary({ buffer, folder = 'general', publicIdPrefix } = {}) {
    if (!buffer) {
        const err = new Error('Buffer de imagen no proporcionado');
        err.status = 400;
        throw err;
    }

    if (!CLOUDINARY_ENABLED) {
        const err = new Error('Cloudinary no está habilitado en este entorno');
        err.status = 400;
        throw err;
    }

    try {
        const result = await uploadBuffer(buffer, { folder, publicIdPrefix });

        // Normalizar respuesta
        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            raw: result
        };
    } catch (error) {
        const err = new Error('Error subiendo imagen a Cloudinary');
        err.status = error.http_code || 500;
        throw err;
    }
}

async function deleteFromCloudinary(publicId) {
    if (!publicId) {
        const err = new Error('publicId no proporcionado');
        err.status = 400;
        throw err;
    }

    if (!CLOUDINARY_ENABLED) {
        const err = new Error('Cloudinary no está habilitado en este entorno');
        err.status = 400;
        throw err;
    }

    try {
        const resp = await deleteImage(publicId);
        return resp;
    } catch (error) {
        const err = new Error('Error eliminando imagen en Cloudinary');
        err.status = error.http_code || 500;
        throw err;
    }
}

module.exports = {
    uploadBufferToCloudinary,
    deleteFromCloudinary
};
