const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol,
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'No autenticado' });
    }
}

module.exports = authMiddleware;