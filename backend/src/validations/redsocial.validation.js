const {
    z,
    postIdParamSchema,
    positiveInt,
} = require('./common.validation');

const postsQuerySchema = z.object({
    page: positiveInt.max(100000).default(1),
    limit: positiveInt.max(50, 'limit máximo: 50').default(20),
    search: z.string().trim().max(80, 'search no puede superar 80 caracteres').optional(),
}).strip();

const crearPostBodySchema = z.object({
    imagen: z.string().trim().url('imagen debe ser una URL válida').refine((value) => {
        if (value.startsWith('data:')) return false;

        if (String(process.env.CLOUDINARY_ENABLED).toLowerCase() !== 'true') {
            return true;
        }

        return value.includes('res.cloudinary.com');
    }, 'imagen inválida o no permitida para el entorno actual'),
    descripcion: z.string().trim().max(2000, 'descripcion no puede superar 2000 caracteres').optional(),
    imagePublicId: z.string().trim().max(500).optional(),
}).strict();

const likeParamsSchema = postIdParamSchema;
const likeBodySchema = z.object({}).strict();

const comentarParamsSchema = postIdParamSchema;
const comentarBodySchema = z.object({
    texto: z.string().trim().min(1, 'El comentario no puede estar vacío').max(500, 'El comentario no puede superar los 500 caracteres'),
}).strict();

const eliminarPostParamsSchema = postIdParamSchema;

module.exports = {
    postsQuerySchema,
    crearPostBodySchema,
    likeParamsSchema,
    likeBodySchema,
    comentarParamsSchema,
    comentarBodySchema,
    eliminarPostParamsSchema,
};
