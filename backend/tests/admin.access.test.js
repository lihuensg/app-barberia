const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/prisma', () => ({
    usuario: {
        findUnique: jest.fn(),
    },
}));

const prisma = require('../src/config/prisma');
const authMiddleware = require('../src/middlewares/auth.middleware');
const adminMiddleware = require('../src/middlewares/admin.middleware');

describe('Acceso admin - Seguridad', () => {
    let app;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test_secret_1234567890_test_secret_1234567890';
        app = express();
        app.get('/admin-only', authMiddleware, adminMiddleware, (req, res) => {
            res.status(200).json({ ok: true });
        });
    });

    test('sin token devuelve 401', async () => {
        const res = await request(app).get('/admin-only');
        expect(res.status).toBe(401);
    });

    test('token cliente devuelve 403', async () => {
        const tokenCliente = jwt.sign({ id: 2, email: 'cli@test.com', rol: 'cliente' }, process.env.JWT_SECRET);
        prisma.usuario.findUnique.mockResolvedValue({ id: 2, rol: 'cliente', email: 'cli@test.com', nombre: 'Cli' });

        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${tokenCliente}`);

        expect(res.status).toBe(403);
    });

    test('token admin devuelve 200', async () => {
        const tokenAdmin = jwt.sign({ id: 1, email: 'admin@test.com', rol: 'admin' }, process.env.JWT_SECRET);
        prisma.usuario.findUnique.mockResolvedValue({ id: 1, rol: 'admin', email: 'admin@test.com', nombre: 'Admin' });

        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    test('token viejo con rol degradado a cliente devuelve 403', async () => {
        const oldAdminToken = jwt.sign({ id: 7, email: 'oldadmin@test.com', rol: 'admin' }, process.env.JWT_SECRET);
        prisma.usuario.findUnique.mockResolvedValue({ id: 7, rol: 'cliente', email: 'oldadmin@test.com', nombre: 'Old' });

        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${oldAdminToken}`);

        expect(res.status).toBe(403);
    });
});
