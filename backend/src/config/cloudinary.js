/**
 * Configuración de Cloudinary para almacenamiento de imágenes en la nube
 * 
 * IMPORTANTE: 
 * - En desarrollo local: CLOUDINARY_ENABLED=false (usa datos locales/URLs)
 * - En producción: CLOUDINARY_ENABLED=true (requiere credenciales)
 * 
 * Nunca exponer CLOUDINARY_API_SECRET al frontend.
 */

const cloudinary = require('cloudinary').v2;

const CLOUDINARY_ENABLED = String(process.env.CLOUDINARY_ENABLED).toLowerCase() === 'true';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'nazabarber';

if (CLOUDINARY_ENABLED) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary está habilitado pero faltan credenciales en las variables de entorno');
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

async function uploadBuffer(buffer, { folder = 'general', publicIdPrefix } = {}) {
    if (!CLOUDINARY_ENABLED) {
        const error = new Error('Cloudinary no está habilitado en este entorno');
        error.status = 400;
        throw error;
    }

    const uploadOptions = {
        folder: `${CLOUDINARY_FOLDER}/${folder}`,
        resource_type: 'image',
        overwrite: true
    };

    if (publicIdPrefix) uploadOptions.public_id = publicIdPrefix;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });

        stream.end(buffer);
    });
}

async function deleteImage(publicId) {
    if (!CLOUDINARY_ENABLED) {
        const error = new Error('Cloudinary no está habilitado en este entorno');
        error.status = 400;
        throw error;
    }

    return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = {
    CLOUDINARY_ENABLED,
    CLOUDINARY_FOLDER,
    cloudinary,
    uploadBuffer,
    deleteImage
};
