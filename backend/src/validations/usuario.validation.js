const {
    z,
    nombreSchema,
    telefonoSchema,
    positiveInt,
} = require('./common.validation');

const updateMeBodySchema = z.object({
    nombre: nombreSchema.optional(),
    telefono: telefonoSchema.optional(),
    instagram: z.string().trim().max(80, 'Instagram no puede superar 80 caracteres').optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
});

const subirFotoBodySchema = z.object({
    foto: z.string().trim().url('La foto debe ser una URL válida').refine((value) => {
        if (String(process.env.CLOUDINARY_ENABLED).toLowerCase() !== 'true') {
            return true;
        }

        return value.includes('res.cloudinary.com');
    }, 'La URL de la foto debe ser de Cloudinary cuando CLOUDINARY_ENABLED=true'),
}).strict();

const clientesQuerySchema = z.object({
    page: positiveInt.max(100000).default(1),
    limit: positiveInt.max(100, 'limit máximo: 100').default(20),
    search: z.string().trim().max(80, 'search no puede superar 80 caracteres').optional(),
}).strip();

module.exports = {
    updateMeBodySchema,
    subirFotoBodySchema,
    clientesQuerySchema,
};
