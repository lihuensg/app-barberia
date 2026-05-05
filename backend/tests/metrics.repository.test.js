const prisma = require('../src/config/prisma');

jest.mock('../src/config/prisma', () => ({
    turno: {
        count: jest.fn(),
        findMany: jest.fn(),
    },
    usuario: {
        count: jest.fn(),
    },
    post: {
        count: jest.fn(),
    },
}));

const repo = require('../src/repositories/turnos.repository');

describe('repositorio.getMetrics', () => {
    beforeEach(() => {
        jest.useRealTimers();
        jest.resetAllMocks();
    });

    test('consulta cortados y cancelados por semana y mes con rangos UTC correctos', async () => {
        jest.useFakeTimers('modern');
        jest.setSystemTime(new Date('2026-05-04T14:00:00.000Z'));

        prisma.turno.count
            .mockResolvedValueOnce(12) // availableNow
            .mockResolvedValueOnce(8)  // upcomingReserved
            .mockResolvedValueOnce(2)  // cutToday
            .mockResolvedValueOnce(1)  // cancelledToday
            .mockResolvedValueOnce(10) // availableToday
            .mockResolvedValueOnce(7)  // reservedToday
            .mockResolvedValueOnce(18) // availableWeek
            .mockResolvedValueOnce(11) // reservedWeek
            .mockResolvedValueOnce(3)  // cancelledWeek
            .mockResolvedValueOnce(52) // availableMonth
            .mockResolvedValueOnce(31) // reservedMonth
            .mockResolvedValueOnce(7)  // cancelledMonth
            .mockResolvedValueOnce(6)  // cutWeek
            .mockResolvedValueOnce(4); // cutMonth

        prisma.usuario.count.mockResolvedValueOnce(150);
        prisma.post.count.mockResolvedValueOnce(3);
        prisma.turno.findMany.mockResolvedValueOnce([]);

        const metrics = await repo.getMetrics();

        expect(prisma.post.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
        expect(prisma.usuario.count).toHaveBeenCalledWith({ where: { rol: 'cliente' } });

        expect(metrics.week).toEqual({
            available: 18,
            reserved: 11,
            cut: 6,
            cancelled: 3,
        });
        expect(metrics.month).toEqual({
            available: 52,
            reserved: 31,
            cut: 4,
            cancelled: 7,
        });

        const countCalls = prisma.turno.count.mock.calls.map(([args]) => args.where);
        expect(countCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({
                estado: 'cortado',
                fecha: {
                    gte: new Date('2026-05-04T00:00:00.000Z'),
                    lte: new Date('2026-05-04T23:59:59.999Z'),
                },
            }),
            expect.objectContaining({
                estado: 'cancelado',
                fecha: {
                    gte: new Date('2026-05-04T00:00:00.000Z'),
                    lte: new Date('2026-05-04T23:59:59.999Z'),
                },
            }),
            expect.objectContaining({
                estado: 'cortado',
                fecha: {
                    gte: new Date('2026-05-04T00:00:00.000Z'),
                    lte: new Date('2026-05-10T23:59:59.999Z'),
                },
            }),
            expect.objectContaining({
                estado: 'cancelado',
                fecha: {
                    gte: new Date('2026-05-04T00:00:00.000Z'),
                    lte: new Date('2026-05-10T23:59:59.999Z'),
                },
            }),
            expect.objectContaining({
                estado: 'cortado',
                fecha: {
                    gte: new Date('2026-05-01T00:00:00.000Z'),
                    lte: new Date('2026-05-31T23:59:59.999Z'),
                },
            }),
            expect.objectContaining({
                estado: 'cancelado',
                fecha: {
                    gte: new Date('2026-05-01T00:00:00.000Z'),
                    lte: new Date('2026-05-31T23:59:59.999Z'),
                },
            }),
        ]));
    });
});