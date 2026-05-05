jest.mock('../src/repositories/turnos.repository', () => ({
    reservarClienteAtomico: jest.fn(),
    cancelarCliente: jest.fn(),
    asignarTurnoAdmin: jest.fn(),
}));

const turnosRepository = require('../src/repositories/turnos.repository');
const turnosService = require('../src/services/turnos.service');

describe('Turnos Service - Casos críticos', () => {
    test('reserva de turno no disponible devuelve 409', async () => {
        const err = new Error('El turno ya no está disponible o no existe');
        err.status = 409;
        turnosRepository.reservarClienteAtomico.mockRejectedValue(err);

        await expect(turnosService.reservarCliente(2, { turnoId: 100 }))
            .rejects
            .toMatchObject({ status: 409 });
    });

    test('cliente no cancela turno ajeno (403)', async () => {
        const err = new Error('No tenés permiso para cancelar este turno');
        err.status = 403;
        turnosRepository.cancelarCliente.mockRejectedValue(err);

        await expect(turnosService.cancelarCliente(2, 999))
            .rejects
            .toMatchObject({ status: 403 });
    });

    test('admin recibe warning 409 si el cliente ya tiene un turno activo', async () => {
        const err = new Error('Este cliente ya tiene un turno activo futuro.');
        err.status = 409;
        err.requiresConfirmation = true;
        err.existingAppointments = [{ id: 12, fechaHora: '2026-05-10T11:00:00.000Z', estado: 'reservado' }];
        turnosRepository.asignarTurnoAdmin.mockRejectedValue(err);

        await expect(turnosService.asignarTurnoAdmin({ turnoId: 50, usuarioId: 2 }))
            .rejects
            .toMatchObject({ status: 409, requiresConfirmation: true });
    });

    test('admin puede asignar turno con force cuando el cliente ya tiene otro activo', async () => {
        turnosRepository.asignarTurnoAdmin.mockResolvedValue({
            turno: {
                id: 50,
                fecha: new Date('2026-05-10T00:00:00.000Z'),
                hora: new Date('1970-01-01T11:00:00.000Z'),
                estado: 'reservado',
                usuarioId: 2,
                usuario: { nombre: 'Cliente', email: 'cliente@test.com', telefono: '3430000001', foto: null },
            },
            warnings: true,
            existingAppointments: [{ id: 12, fechaHora: '2026-05-10T11:00:00.000Z', estado: 'reservado' }],
        });

        const result = await turnosService.asignarTurnoAdmin({ turnoId: 50, usuarioId: 2, force: true });

        expect(result.turno.id).toBe(50);
        expect(result.warnings).toBe(true);
        expect(Array.isArray(result.existingAppointments)).toBe(true);
    });
});
