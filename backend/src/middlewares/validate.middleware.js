const formatIssues = (issues) => {
    return issues.map((issue) => ({
        field: issue.path && issue.path.length ? issue.path.join('.') : 'body',
        message: issue.message,
    }));
};

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
