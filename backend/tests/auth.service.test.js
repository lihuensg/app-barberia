jest.mock('../src/repositories/usuarios.repository', () => ({
    buscarPorEmail: jest.fn(),
    crearCliente: jest.fn(),
}));

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

const usuariosRepository = require('../src/repositories/usuarios.repository');
const bcrypt = require('bcrypt');
const authService = require('../src/services/auth.service');

describe('Auth Service - Seguridad', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test_secret_1234567890_test_secret_1234567890';
        process.env.JWT_EXPIRES_IN = '15m';
    });

    test('login inválido devuelve 401', async () => {
        usuariosRepository.buscarPorEmail.mockResolvedValue(null);

        await expect(authService.login({ email: 'noexiste@test.com', password: 'x' }))
            .rejects
            .toMatchObject({ status: 401, message: 'Email o contraseña incorrectos.' });
    });

    test('login exitoso no devuelve passwordHash', async () => {
        usuariosRepository.buscarPorEmail.mockResolvedValue({
            id: 10,
            nombre: 'Cliente',
            email: 'cliente@test.com',
            passwordHash: 'hash_guardado',
            rol: 'cliente',
        });
        bcrypt.compare.mockResolvedValue(true);

        const result = await authService.login({ email: 'cliente@test.com', password: 'Password123' });

        expect(result).toHaveProperty('token');
        expect(result.usuario).toBeDefined();
        expect(result.usuario.passwordHash).toBeUndefined();
    });

    test('registro con rol admin malicioso no crea admin', async () => {
        usuariosRepository.buscarPorEmail.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hash_generado');
        usuariosRepository.crearCliente.mockResolvedValue({
            id: 99,
            nombre: 'Hacker',
            email: 'hacker@test.com',
            rol: 'cliente',
            passwordHash: 'hash_generado',
        });

        const result = await authService.registrar({
            nombre: 'Hacker',
            email: 'hacker@test.com',
            password: 'Password123',
            whatsapp: '+5493410000000',
            rol: 'admin',
        });

        expect(usuariosRepository.crearCliente).toHaveBeenCalledTimes(1);
        const payloadCreacion = usuariosRepository.crearCliente.mock.calls[0][0];

        expect(payloadCreacion.rol).toBeUndefined();
        expect(result.usuario.rol).toBe('cliente');
    });
});
