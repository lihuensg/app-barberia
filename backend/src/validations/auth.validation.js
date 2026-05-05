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
    telefono: z.string().trim().max(30).optional(),
    instagram: z.string().trim().max(80).optional(),
}).strict();

const loginBodySchema = z.object({
    email: emailSchema,
    password: z.string().trim().min(1, 'Password es obligatorio').max(72, 'Password inválido'),
}).strict();

const forgotPasswordBodySchema = z.object({
    email: emailSchema,
}).strict();

const resetPasswordParamsSchema = z.object({
    token: z.string().trim().min(10, 'Token inválido'),
}).strict();

const resetPasswordBodySchema = z.object({
    newPassword: passwordSchema,
    confirmPassword: z.string().trim().min(1).max(72).optional(),
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
