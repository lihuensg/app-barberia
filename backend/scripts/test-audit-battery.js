require('dotenv').config();

const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

const authController = require('../src/controllers/auth.controller');
const redsocialController = require('../src/controllers/redsocial.controller');
const turnosController = require('../src/controllers/turnos.controller');
const { auditLog } = require('../src/services/audit.service');

function mockRes() {
    return {
        status(code) { this._status = code; return this; },
        json(payload) { this._json = payload; return this; },
        send(payload) { this._send = payload; return this; }
    };
}

function mockReq({ body = {}, params = {}, query = {}, usuario = null, admin = null, ip = '127.0.0.1', headers = {} } = {}) {
    return {
        body,
        params,
        query,
        usuario,
        admin,
        ip,
        headers,
        get(k) { return this.headers[k.toLowerCase()] || null; }
    };
}

async function ensureClientUser() {
    const email = 'cliente.test@nazabarber.test';
    let user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
        const hash = await bcrypt.hash('cliente123', 10);
        user = await prisma.usuario.create({ data: { nombre: 'Cliente Test', email, passwordHash: hash, rol: 'cliente' } });
    }
    return user;
}

async function run() {
    try {
        // Limpio audit logs para empezar desde cero
        await prisma.auditLog.deleteMany({});
        console.log('✅ AuditLog table cleared');

        // 1) Login fallido (controller)
        const req1 = mockReq({ body: { email: 'noexiste@x.com', password: 'x' }, headers: { 'user-agent': 'test/1' } });
        const res1 = mockRes();
        await authController.login(req1, res1);
        console.log('🔸 Login failed attempted - controller handled');

        // 2) Forgot password (existing admin from seed)
        const req2 = mockReq({ body: { email: 'admin@nazabarber.com' }, headers: { 'user-agent': 'test/2' } });
        const res2 = mockRes();
        await authController.forgotPassword(req2, res2);
        console.log('🔸 Forgot password requested (admin)');

        // 3) Reset password success: create token via repository and call controller
        const tokenRepo = require('../src/repositories/passwordResetToken.repository');
        const adminUser = await prisma.usuario.findUnique({ where: { email: 'admin@nazabarber.com' } });
        const { token } = await tokenRepo.crearTokenReset(adminUser.id, 60);
        const req3 = mockReq({ params: { token }, body: { newPassword: 'newAdminPass123' }, headers: { 'user-agent': 'test/3' } });
        const res3 = mockRes();
        await authController.resetPassword(req3, res3);
        console.log('🔸 Reset password performed (admin)');

        // 4) Admin crea turno (controller)
        const adminCtx = { id: adminUser.id, email: adminUser.email, nombre: adminUser.nombre, rol: 'admin' };
        const crearReq = mockReq({ body: { fecha: new Date(Date.now() + 24*3600*1000).toISOString().slice(0,10), hora: '10:00' }, admin: adminCtx, headers: { 'user-agent': 'test/4' } });
        const crearRes = mockRes();
        await turnosController.crearTurno(crearReq, crearRes);
        console.log('🔸 Admin created a turno');

        // Obtener el turno creado
        const ultimoTurno = await prisma.turno.findFirst({ orderBy: { createdAt: 'desc' } });

        // 5) Cliente reserva turno
        const cliente = await ensureClientUser();
        const reservarReq = mockReq({ body: { turnoId: ultimoTurno.id }, usuario: { id: cliente.id }, headers: { 'user-agent': 'test/5' } });
        const reservarRes = mockRes();
        await turnosController.reservarCliente(reservarReq, reservarRes);
        console.log('🔸 Cliente reserved turno');

        // 6) Cliente cancela turno
        const cancelarReq = mockReq({ params: { id: String(ultimoTurno.id) }, usuario: { id: cliente.id }, headers: { 'user-agent': 'test/6' } });
        const cancelarRes = mockRes();
        await turnosController.cancelarCliente(cancelarReq, cancelarRes);
        console.log('🔸 Cliente canceled turno');

        // 7) Admin genera semana (small)
        const semanaReq = mockReq({ body: { fechaInicio: new Date(Date.now() + 24*3600*1000).toISOString().slice(0,10), horaInicio: '09:00', horaFin: '10:00', intervaloMinutos: 30, cantidadDias: 1 }, admin: adminCtx, headers: { 'user-agent': 'test/7' } });
        const semanaRes = mockRes();
        await turnosController.generarSemana(semanaReq, semanaRes);
        console.log('🔸 Admin generated week');

        // 8) Admin marca cortado: need a reserved turno; try to create one, if unique constraint fail, pick an existing reserved
        let t2;
        try {
            t2 = await prisma.turno.create({ data: { fecha: new Date(Date.now() + 48*3600*1000), hora: new Date('1970-01-01T11:00:00Z'), estado: 'reservado', usuarioId: cliente.id } });
        } catch (e) {
            // Buscar un turno reservado existente
            t2 = await prisma.turno.findFirst({ where: { estado: 'reservado' } });
            if (!t2) throw e;
        }
        const marcarReq = mockReq({ params: { id: String(t2.id) }, admin: adminCtx, headers: { 'user-agent': 'test/8' } });
        const marcarRes = mockRes();
        await turnosController.marcarCortado(marcarReq, marcarRes);
        console.log('🔸 Admin marked cortado');

        // 9) Admin elimina turno
        const eliminarReq = mockReq({ params: { id: String(t2.id) }, admin: adminCtx, headers: { 'user-agent': 'test/9' } });
        const eliminarRes = mockRes();
        await turnosController.eliminarTurno(eliminarReq, eliminarRes);
        console.log('🔸 Admin deleted turno');

        // 10) Admin crea post
        const postReq = mockReq({ body: { imagen: 'https://example.com/img.jpg', descripcion: 'Post de prueba' }, admin: adminCtx, usuario: { id: adminUser.id }, headers: { 'user-agent': 'test/10' } });
        const postRes = mockRes();
        await redsocialController.crearPost(postReq, postRes);
        console.log('🔸 Admin created post');

        // 11) Admin elimina post (take last post)
        const lastPost = await prisma.post.findFirst({ orderBy: { createdAt: 'desc' } });
        const delPostReq = mockReq({ params: { postId: String(lastPost.id) }, admin: adminCtx, headers: { 'user-agent': 'test/11' } });
        const delPostRes = mockRes();
        await redsocialController.eliminarPost(delPostReq, delPostRes);
        console.log('🔸 Admin deleted post');

        // Consultar algunos audit logs
        const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
        console.log('=== Últimos audit logs ===');
        logs.forEach(l => console.log(`${l.createdAt.toISOString()} | ${l.action} | ${l.entity} | userId=${l.userId} | metadata=${JSON.stringify(l.metadata)}`));

        console.log('✅ Test battery finished');
    } catch (error) {
        console.error('Error running test battery:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
