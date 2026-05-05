const prisma = require('../src/config/prisma');

jest.mock('../src/config/prisma', () => ({
    turno: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

const repo = require('../src/repositories/turnos.repository');

describe('repositorio.marcarCortado', () => {
    beforeEach(() => jest.useRealTimers());
    afterEach(() => {
        jest.resetAllMocks();
        jest.useRealTimers();
    });

    test('rechaza marcar cortado para turno futuro', async () => {
        // fijar "ahora"
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-04T14:00:00.000Z'));

        prisma.turno.findUnique.mockResolvedValue({
            id: 1,
            fecha: new Date('2026-05-04T00:00:00.000Z'),
            hora: new Date('1970-01-01T14:15:00.000Z'),
            estado: 'reservado',
        });

        await expect(repo.marcarCortado(1)).rejects.toMatchObject({ status: 400 });
    });

    test('acepta marcar cortado para turno pasado', async () => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-04T14:00:00.000Z'));

        prisma.turno.findUnique.mockResolvedValue({
            id: 2,
            fecha: new Date('2026-05-04T00:00:00.000Z'),
            hora: new Date('1970-01-01T13:30:00.000Z'),
            estado: 'reservado',
        });

        prisma.turno.update.mockResolvedValue({ id: 2, estado: 'cortado' });

        const res = await repo.marcarCortado(2);

        expect(prisma.turno.update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: { estado: 'cortado' },
        });
        expect(res).toMatchObject({ id: 2, estado: 'cortado' });
    });

    test('rechaza marcar cortado si estado no permitido', async () => {
        prisma.turno.findUnique.mockResolvedValue({
            id: 3,
            fecha: new Date('2026-05-03T00:00:00.000Z'),
            hora: new Date('1970-01-01T12:00:00.000Z'),
            estado: 'disponible',
        });

        await expect(repo.marcarCortado(3)).rejects.toMatchObject({ status: 400 });
    });
});
