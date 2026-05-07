const {
    z,
    emailSchema,
    passwordSchema,
    nombreSchema,
} = require('./common.validation');

const registerBodySchema = z.object({
    nombre: nombreSchema,
    email: emailSchema,
    password: passwordSchema,
    whatsapp: z.string({
        required_error: 'El WhatsApp es obligatorio.',
        invalid_type_error: 'El WhatsApp es obligatorio.',
    }).trim().min(1, 'El WhatsApp es obligatorio.').max(30, 'Ingresá un WhatsApp válido con código de área.'),
}).strict();

const loginBodySchema = z.object({
    email: emailSchema,
    password: z.string({
        required_error: 'La contraseña es obligatoria.',
        invalid_type_error: 'La contraseña es obligatoria.',
    }).trim().min(1, 'La contraseña es obligatoria.').max(72, 'La contraseña es inválida.'),
}).strict();

const forgotPasswordBodySchema = z.object({
    email: emailSchema,
}).strict();

const resetPasswordParamsSchema = z.object({
    token: z.string().trim().min(10, 'El enlace para cambiar la contraseña no es válido.'),
}).strict();

const resetPasswordBodySchema = z.object({
    newPassword: passwordSchema,
    confirmPassword: z.string().trim().min(1, 'Confirmá tu nueva contraseña.').max(72).optional(),
}).strip().superRefine((data, ctx) => {
    if (data.confirmPassword !== undefined && data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            code: 'custom',
            path: ['confirmPassword'],
            message: 'Las contraseñas no coinciden',
        });
    }
});

module.exports = {
    registerBodySchema,
    loginBodySchema,
    forgotPasswordBodySchema,
    resetPasswordParamsSchema,
    resetPasswordBodySchema,
};
