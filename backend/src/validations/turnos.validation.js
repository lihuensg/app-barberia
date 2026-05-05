const {
    z,
    positiveInt,
    turnoIdParamSchema,
    hhmmSchema,
    emailSchema,
    nombreSchema,
    telefonoSchema,
} = require('./common.validation');

const estadoEnum = z.enum(['disponible', 'reservado', 'cortado', 'cancelado']);

const turnosDisponiblesQuerySchema = z.object({
    fechaDesde: z.string().trim().optional(),
    fechaHasta: z.string().trim().optional(),
    page: positiveInt.max(100000).default(1),
    limit: positiveInt.max(200, 'limit máximo: 200').default(100),
}).strip();

const reservarAnonimoBodySchema = z.object({
    turnoId: positiveInt,
    nombre: nombreSchema,
    telefono: telefonoSchema,
    email: emailSchema.optional(),
    notas: z.string().trim().max(300, 'Notas no puede superar 300 caracteres').optional(),
}).strict();

const reservarClienteBodySchema = z.object({
    turnoId: positiveInt,
    notas: z.string().trim().max(300, 'Notas no puede superar 300 caracteres').optional(),
}).strict();

const historialQuerySchema = z.object({
    page: positiveInt.max(100000).default(1),
    limit: positiveInt.max(100, 'limit máximo: 100').default(20),
}).strip();

const cancelarClienteParamsSchema = turnoIdParamSchema;

const cancelarClienteBodySchema = z.object({
    motivo: z.string().trim().max(300, 'Motivo no puede superar 300 caracteres').optional(),
}).strict();

const adminTurnosQuerySchema = z.object({
    estado: estadoEnum.optional(),
    fecha: z.string().trim().optional(),
    fechaDesde: z.string().trim().optional(),
    fechaHasta: z.string().trim().optional(),
    cliente: z.string().trim().max(80, 'cliente no puede superar 80 caracteres').optional(),
    page: positiveInt.max(100000).default(1),
    limit: positiveInt.max(500, 'limit máximo: 500').default(500),
    sort: z.enum(['fecha', 'hora', 'estado', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
}).strip();

const crearTurnoBodySchema = z.object({
    fecha: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD'),
    hora: hhmmSchema,
}).strict();

const asignarTurnoBodySchema = z.object({
    turnoId: positiveInt,
    usuarioId: positiveInt,
    force: z.boolean().optional(),
}).strict();

const generarSemanaBodySchema = z.object({
    fechaInicio: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'fechaInicio debe tener formato YYYY-MM-DD'),
    horaInicio: hhmmSchema,
    horaFin: hhmmSchema,
    intervaloMinutos: positiveInt,
    diasIncluidos: z.array(z.number().int().min(0).max(6)).optional(),
    cantidadDias: positiveInt.max(31, 'cantidadDias máximo: 31').optional(),
}).strict();

const marcarCortadoParamsSchema = turnoIdParamSchema;

const marcarCortadoBodySchema = z.object({
    notasInternas: z.string().trim().max(300, 'notasInternas no puede superar 300 caracteres').optional(),
}).strict();

const eliminarTurnoParamsSchema = turnoIdParamSchema;

module.exports = {
    turnosDisponiblesQuerySchema,
    reservarAnonimoBodySchema,
    reservarClienteBodySchema,
    historialQuerySchema,
    cancelarClienteParamsSchema,
    cancelarClienteBodySchema,
    adminTurnosQuerySchema,
    crearTurnoBodySchema,
    asignarTurnoBodySchema,
    generarSemanaBodySchema,
    marcarCortadoParamsSchema,
    marcarCortadoBodySchema,
    eliminarTurnoParamsSchema,
};
