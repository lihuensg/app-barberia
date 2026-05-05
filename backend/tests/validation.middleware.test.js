const express = require('express');
const request = require('supertest');

const { validateBody, validateParams } = require('../src/middlewares/validate.middleware');
const { registerBodySchema } = require('../src/validations/auth.validation');
const { cancelarClienteParamsSchema } = require('../src/validations/turnos.validation');
const { comentarBodySchema, comentarParamsSchema } = require('../src/validations/redsocial.validation');

describe('Validaciones Zod + Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        app.post('/auth/register', validateBody(registerBodySchema), (req, res) => {
            res.status(201).json({ ok: true, body: req.body });
        });

        app.put('/turnos/cancelarCliente/:id', validateParams(cancelarClienteParamsSchema), (req, res) => {
            res.status(200).json({ ok: true, params: req.params });
        });

        app.post('/redsocial/comentar/:postId', validateParams(comentarParamsSchema), validateBody(comentarBodySchema), (req, res) => {
            res.status(201).json({ ok: true });
        });
    });

    test('registro con rol admin extra devuelve 400 (strict schema)', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                nombre: 'Hacker',
                email: 'hacker@test.com',
                password: 'Password123',
                rol: 'admin',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Datos inválidos');
    });

    test('id inválido en cancelarCliente devuelve 400', async () => {
        const res = await request(app)
            .put('/turnos/cancelarCliente/abc')
            .send({});

        expect(res.status).toBe(400);
    });

    test('comentario vacío devuelve 400', async () => {
        const res = await request(app)
            .post('/redsocial/comentar/10')
            .send({ texto: '   ' });

        expect(res.status).toBe(400);
    });
});
