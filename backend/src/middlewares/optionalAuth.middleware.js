const jwt = require('jsonwebtoken');

function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            req.usuario = null;
            return next();
        }

        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        req.usuario = null;
        next();
    }
}

module.exports = optionalAuthMiddleware;