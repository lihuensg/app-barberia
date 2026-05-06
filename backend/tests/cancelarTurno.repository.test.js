const prisma = require('../src/config/prisma');

jest.mock('../src/config/prisma', () => ({
    turno: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    turnoCancelacion: {
        findMany: jest.fn(),
    },
    $transaction: jest.fn(),
}));

const repo = require('../src/repositories/turnos.repository');

describe('repositorio.cancelaciones de turnos', () => {
    beforeEach(() => {
        jest.useRealTimers();
        jest.resetAllMocks();

        prisma.$transaction.mockImplementation(async (callback) => {
            const tx = {
                turnoCancelacion: {
                    create: jest.fn().mockResolvedValue({ id: 1 }),
                },
                turno: {
                    update: jest.fn().mockResolvedValue({
                        id: 10,
                        estado: 'disponible',
                        usuarioId: null,
                        anonimoNombre: null,
                        anonimoEmail: null,
                        anonimoTelefono: null,
                    }),
                },
            };

            const result = await callback(tx);
            return result;
        });
    });

    test('cliente cancela con más de 1 hora: registra historial y libera turno', async () => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-06T13:00:00.000Z'));

        prisma.turno.findUnique.mockResolvedValue({
            id: 10,
            estado: 'reservado',
            usuarioId: 2,
            fecha: new Date('2026-05-06T00:00:00.000Z'),
            hora: new Date('1970-01-01T15:00:00.000Z'),
            anonimoNombre: null,
            anonimoEmail: null,
            anonimoTelefono: null,
            usuario: {
                nombre: 'Lihuen',
                email: 'lihuen@test.com',
                telefono: '3430000000',
            },
        });

        const result = await repo.cancelarCliente(2, 10, { motivo: 'No llego' });

        expect(result).toMatchObject({
            previousEstado: 'reservado',
            updated: {
                id: 10,
                estado: 'disponible',
                usuarioId: null,
            },
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    test('cliente no puede cancelar con menos de 1 hora', async () => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-06T17:10:00.000Z'));

        prisma.turno.findUnique.mockResolvedValue({
            id: 10,
            estado: 'reservado',
            usuarioId: 2,
            fecha: new Date('2026-05-06T00:00:00.000Z'),
            hora: new Date('1970-01-01T15:00:00.000Z'),
            anonimoNombre: null,
            anonimoEmail: null,
            anonimoTelefono: null,
            usuario: null,
        });

        await expect(repo.cancelarCliente(2, 10)).rejects.toMatchObject({ status: 400 });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('cliente no puede cancelar turno de otro usuario', async () => {
        prisma.turno.findUnique.mockResolvedValue({
            id: 10,
            estado: 'reservado',
            usuarioId: 99,
            fecha: new Date('2026-05-06T00:00:00.000Z'),
            hora: new Date('1970-01-01T15:00:00.000Z'),
            usuario: null,
        });

        await expect(repo.cancelarCliente(2, 10)).rejects.toMatchObject({ status: 403 });
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('cliente no puede cancelar turno cortado', async () => {
        prisma.turno.findUnique.mockResolvedValue({
            id: 10,
            estado: 'cortado',
            usuarioId: 2,
            fecha: new Date('2026-05-06T00:00:00.000Z'),
            hora: new Date('1970-01-01T15:00:00.000Z'),
            usuario: null,
        });

        await expect(repo.cancelarCliente(2, 10)).rejects.toMatchObject({ status: 400 });
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test('admin puede cancelar reserva y liberar horario sin regla de 1 hora', async () => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-06T14:40:00.000Z'));

        prisma.turno.findUnique.mockResolvedValue({
            id: 10,
            estado: 'reservado',
            usuarioId: 2,
            fecha: new Date('2026-05-06T00:00:00.000Z'),
            hora: new Date('1970-01-01T15:00:00.000Z'),
            anonimoNombre: null,
            anonimoEmail: null,
            anonimoTelefono: null,
            usuario: {
                nombre: 'Lihuen',
                email: 'lihuen@test.com',
                telefono: '3430000000',
            },
        });

        const result = await repo.cancelarAdmin(10, { motivo: 'No se presentó' });

        expect(result).toMatchObject({
            previousEstado: 'reservado',
            updated: {
                id: 10,
                estado: 'disponible',
                usuarioId: null,
            },
        });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
});
