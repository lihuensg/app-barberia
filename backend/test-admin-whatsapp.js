const prisma = require('./src/config/prisma');
const { getAdminTurnos } = require('./src/repositories/turnos.repository');
const { getAdminTurnos: getAdminTurnosService } = require('./src/services/turnos.service');

(async () => {
    try {
        // Test repositorio
        console.log('=== Testing Repository getAdminTurnos ===');
        const turnosRepo = await getAdminTurnos({ estado: 'reservado', limit: 5 });
        console.log('Repository result (first turno):');
        if (turnosRepo.length > 0) {
            console.log(JSON.stringify(turnosRepo[0], null, 2));
        } else {
            console.log('No turnos found');
        }

        // Test servicio
        console.log('\n=== Testing Service getAdminTurnos ===');
        const turnosService = await getAdminTurnosService({ estado: 'reservado', limit: 5 });
        console.log('Service result (first turno):');
        if (turnosService.length > 0) {
            console.log(JSON.stringify(turnosService[0], null, 2));
        } else {
            console.log('No turnos found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
