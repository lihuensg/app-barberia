const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ========================================
// VALIDAR VARIABLES DE ENTORNO AL INICIAR
// ========================================
const { validate: validateEnv, ENV } = require('./config/env');

try {
    validateEnv();
    console.log(`✅ Ambiente: ${ENV.NODE_ENV.toUpperCase()}`);
} catch (error) {
    // El error ya fue logueado en env.js
    process.exit(1);
}

// Cloudinary se inicializa al requerir el módulo si está habilitado

// ========================================
// RUTAS
// ========================================
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const turnosRoutes = require('./routes/turnos.routes');
const redsocialRoutes = require('./routes/redsocial.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ========================================
// HEADERS DE SEGURIDAD (Helmet)
// ========================================
app.use(helmet());

// Deshabilitar header "X-Powered-By"
app.disable('x-powered-by');

// ========================================
// CORS CONFIGURADO POR AMBIENTE
// ========================================
const getAllowedOrigins = () => {
    if (ENV.NODE_ENV === 'production') {
        // En producción: solo FRONTEND_URL
        return [ENV.FRONTEND_URL];
    }

    // En desarrollo: localhost y ports comunes
    return [
        ENV.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4200',
        'http://localhost:3000',
    ].filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (curl, Postman, SSR)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS rechazado: origin=${origin}`);
            callback(new Error(`CORS: origin ${origin} no permitido`));
        }
    },
    credentials: true, // Para cookies y autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600, // 1 hora
}));

// ========================================
// PARSEO DE REQUESTS
// ========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========================================
// STATIC FILES
// ========================================
app.use('/uploads', express.static('uploads'));

// ========================================
// RUTAS PÚBLICAS
// ========================================
app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'NazaBarber API funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});

// Health check (requerido por frontend api-client)
app.get('/api/healthz', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// RUTAS PROTEGIDAS
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/redsocial', redsocialRoutes);
app.use('/api/admin', adminRoutes);

// ========================================
// ERROR HANDLERS
// ========================================

// 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        path: req.path,
        method: req.method,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    // Mapeo de errores específicos de multer
    if (err && err.code === 'LIMIT_FILE_SIZE') {
        const message = 'La imagen supera el tamaño máximo permitido';
        if (ENV.NODE_ENV === 'development') console.error('❌ Multer LIMIT_FILE_SIZE:', err);
        return res.status(400).json({ message });
    }

    // En desarrollo: loguear todo
    if (ENV.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    } else {
        // En producción: loguear sin detalles sensibles
        console.error('❌ Error:', {
            message: err.message,
            status: err.status || 500,
            timestamp: new Date().toISOString(),
        });
    }

    // Responder sin exponer detalles internos
    const status = err.status || 500;
    const message = ENV.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor';

    // Si el error trae status y mensaje personalizado, respetarlo
    if (err.status && err.message) {
        return res.status(err.status).json({ message: err.message });
    }

    res.status(status).json({ message });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║     🧔 NazaBarber API v1.0             ║
  ║     Corriendo en puerto ${PORT}         ║
  ║     Ambiente: ${ENV.NODE_ENV.toUpperCase().padEnd(18)}║
  ╚════════════════════════════════════════╝
    `);

    console.log(`ℹ️  CORS permitidos:`, allowedOrigins);
    console.log(`ℹ️  Database: ${ENV.DATABASE_URL ? '✅ Conectado' : '❌ No configurado'}`);
    console.log(`ℹ️  Cloudinary: ${ENV.CLOUDINARY_ENABLED ? '✅ Habilitado' : '❌ Deshabilitado'}`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on('SIGTERM', () => {
    console.log('📡 SIGTERM recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        process.exit(0);
    });
});

module.exports = app;
