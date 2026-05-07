const FIELD_LABELS = {
    nombre: 'nombre',
    email: 'email',
    password: 'contraseña',
    newPassword: 'nueva contraseña',
    confirmPassword: 'confirmación de contraseña',
    whatsapp: 'WhatsApp',
    telefono: 'WhatsApp',
    fecha: 'fecha',
    hora: 'hora',
    fechaInicio: 'fecha de inicio',
    horaInicio: 'hora de inicio',
    horaFin: 'hora de fin',
    intervaloMinutos: 'intervalo entre turnos',
    turnoId: 'turno',
    descripcion: 'descripción',
    texto: 'comentario',
    imagen: 'imagen',
};

const startsWithArticle = (value) => ['el ', 'la ', 'los ', 'las '].some((a) => value.toLowerCase().startsWith(a));

const humanizeIssue = (issue) => {
    const field = issue.path && issue.path.length ? issue.path.join('.') : 'body';
    const lastPath = issue.path && issue.path.length ? String(issue.path[issue.path.length - 1]) : 'campo';
    const label = FIELD_LABELS[lastPath] || String(lastPath);
    const withArticle = startsWithArticle(label) ? label : `el ${label}`;
    const issueMessage = String(issue.message || '').trim();

    if (issue.code === 'invalid_type') {
        if (issue.received === 'undefined') {
            return { field, message: `${withArticle.charAt(0).toUpperCase()}${withArticle.slice(1)} es obligatorio.` };
        }

        return { field, message: `Ingresá un valor válido para ${label}.` };
    }

    if (issue.code === 'too_small') {
        if (issue.minimum === 1) {
            return { field, message: `${withArticle.charAt(0).toUpperCase()}${withArticle.slice(1)} es obligatorio.` };
        }

        if (lastPath === 'password' || lastPath === 'newPassword') {
            return { field, message: 'La contraseña debe tener al menos 8 caracteres.' };
        }
    }

    if (issue.code === 'invalid_string' && issue.validation === 'email') {
        return { field, message: 'Ingresá un email válido.' };
    }

    if (issue.code === 'invalid_enum_value') {
        return { field, message: `Seleccioná un valor válido para ${label}.` };
    }

    if (!issueMessage || issueMessage === 'Required' || issueMessage.includes('Expected') || issueMessage.includes('Invalid input')) {
        return { field, message: `Ingresá un valor válido para ${label}.` };
    }

    return { field, message: issueMessage };
};

const formatIssues = (issues) => issues.map(humanizeIssue);

const validate = (schema, source) => (req, res, next) => {
    const payload = source === 'body' && (req.body === undefined || req.body === null)
        ? {}
        : req[source];

    const result = schema.safeParse(payload);

    if (!result.success) {
        return res.status(400).json({
            message: 'Datos inválidos',
            errors: formatIssues(result.error.issues),
        });
    }

    req[source] = result.data;
    next();
};

const validateBody = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');

module.exports = {
    validateBody,
    validateParams,
    validateQuery,
};
