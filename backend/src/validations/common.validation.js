const { z } = require('zod');

const isValidDateString = (value) => {
    if (typeof value !== 'string') return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
};

const positiveInt = z.coerce.number({
    invalid_type_error: 'Debe ser un número',
}).int('Debe ser un entero').positive('Debe ser mayor a 0');

const idParamSchema = z.object({
    id: positiveInt,
}).strict();

const turnoIdParamSchema = z.object({
    id: positiveInt,
}).strict();

const postIdParamSchema = z.object({
    postId: positiveInt,
}).strict();

const emailSchema = z.string()
    .trim()
    .toLowerCase()
    .email('Email inválido')
    .max(120, 'El email no puede superar 120 caracteres');

const passwordSchema = z.string()
    .trim()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar 72 caracteres')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'La contraseña debe incluir al menos una letra y un número');

const nombreSchema = z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede superar 80 caracteres');

const telefonoSchema = z.string()
    .trim()
    .max(30, 'El teléfono no puede superar 30 caracteres')
    .regex(/^[0-9+\-()\s]+$/, 'Teléfono inválido');

const shortTextSchema = z.string()
    .trim()
    .max(120, 'Máximo 120 caracteres');

const longTextSchema = z.string()
    .trim()
    .max(1000, 'Máximo 1000 caracteres');

const dateStringSchema = z.string().refine(isValidDateString, 'Fecha inválida');

const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido. Usa HH:mm');

module.exports = {
    z,
    positiveInt,
    idParamSchema,
    turnoIdParamSchema,
    postIdParamSchema,
    emailSchema,
    passwordSchema,
    nombreSchema,
    telefonoSchema,
    shortTextSchema,
    longTextSchema,
    dateStringSchema,
    hhmmSchema,
};
