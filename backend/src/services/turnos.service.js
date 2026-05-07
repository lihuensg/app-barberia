const turnosRepository = require('../repositories/turnos.repository');

function serializeTurno(t) {
    if (!t) return null;
    const clienteId = t.clienteId ?? t.usuarioId ?? null;
    const clienteNombre = t.clienteNombre ?? t.cliente_nombre ?? t.usuario?.nombre ?? t.anonimoNombre ?? null;
    const clienteEmail = t.clienteEmail ?? t.cliente_email ?? t.usuario?.email ?? t.anonimoEmail ?? null;
    const clienteTelefono = t.clienteTelefono ?? t.cliente_telefono ?? t.usuario?.telefono ?? t.anonimoTelefono ?? null;
    const clienteWhatsapp = t.clienteWhatsapp ?? t.cliente_whatsapp ?? t.usuario?.whatsapp ?? t.anonimoTelefono ?? null;
    const clienteFoto = t.clienteFoto ?? t.cliente_foto ?? t.usuario?.foto ?? null;
    const telefonoNormalizado = t.clienteTelefonoNormalized ?? t.cliente_telefono_normalizado ?? t.anonimoTelefonoNormalizado ?? null;
    const whatsappNormalizado = t.clienteWhatsappNormalizado ?? t.cliente_whatsapp_normalizado ?? telefonoNormalizado;

    return {
        id: t.id,
        fecha: t.fecha instanceof Date
            ? t.fecha.toISOString().split('T')[0]
            : String(t.fecha),
        hora: t.hora instanceof Date
            ? t.hora.toISOString().split('T')[1].slice(0, 5)
            : String(t.hora).slice(0, 5),
        estado: t.estado,
        clienteId,
        clienteNombre,
        clienteEmail,
        clienteWhatsapp,
        clienteWhatsappNormalizado: whatsappNormalizado,
        clienteTelefono,
        clienteTelefonoNormalized: telefonoNormalizado,
        clienteFoto,
        anonimo: t.anonimo ?? (!clienteId && !!(t.anonimoNombre ?? t.anonimo_nombre ?? clienteNombre)),
    };
}

async function getDisponibles(query) {
    const turnos = await turnosRepository.getDisponibles(query);
    return turnos.map(serializeTurno);
}

const { normalizeTelefono: normalizePhone, classifyReservationEligibility, getMinBookingDateTime } = require('../utils/turnosBusiness');

async function reservarAnonimo({ turnoId, nombre, email, telefono, whatsapp }, ip = null, isAdmin = false) {
    if (!turnoId || !nombre) {
        const error = new Error('turnoId y nombre son obligatorios');
        error.status = 400;
        throw error;
    }

    // Teléfono/WhatsApp obligatorio para reserva anónima
    const rawPhone = whatsapp || telefono || null;
    const normalized = normalizePhone(rawPhone);
    if (!normalized) {
        const error = new Error('Para reservar sin cuenta tenés que ingresar un número de WhatsApp válido.');
        error.status = 400;
        throw error;
    }

    const turno = await turnosRepository.reservarAnonimoAtomico({ turnoId, nombre, email, telefono: rawPhone, ip, isAdmin });
    return serializeTurno(turno);
}

async function reservarCliente(usuarioId, { turnoId }) {
    if (!turnoId) {
        const error = new Error('turnoId es obligatorio');
        error.status = 400;
        throw error;
    }
    const turno = await turnosRepository.reservarClienteAtomico({ turnoId, usuarioId });
    return serializeTurno(turno);
}

async function historialCliente(usuarioId, query) {
    const turnos = await turnosRepository.historialCliente(usuarioId, query);
    return turnos.map(serializeTurno);
}

async function cancelarCliente(usuarioId, turnoId, body = {}) {
    try {
        const { updated, previousEstado } = await turnosRepository.cancelarCliente(usuarioId, turnoId, body);
        return { turno: serializeTurno(updated), previousEstado };
    } catch (error) {
        // Propagar el error tal cual del repositorio
        throw error;
    }
}

async function cancelarAdmin(turnoId, body = {}) {
    const { updated, previousEstado } = await turnosRepository.cancelarAdmin(turnoId, body);
    return { turno: serializeTurno(updated), previousEstado };
}

async function getAdminTurnos(query) {
    const turnos = await turnosRepository.getAdminTurnos(query);
    return turnos.map(serializeTurno);
}

async function getMetrics() {
    const metrics = await turnosRepository.getMetrics();

    return {
        ...metrics,
        upcomingAppointments: Array.isArray(metrics.upcomingAppointments)
            ? metrics.upcomingAppointments.map(serializeTurno)
            : [],
    };
}

async function getCancelacionesAdmin(query) {
    return turnosRepository.getCancelacionesAdmin(query);
}

async function crearTurno({ fecha, hora }) {
    if (!fecha || !hora) {
        const error = new Error('fecha y hora son obligatorias');
        error.status = 400;
        throw error;
    }
    // Construir candidato en el mismo formato que usan las validaciones
    const candidato = {
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        hora: new Date(`1970-01-01T${hora}:00.000Z`),
    };

    const elig = classifyReservationEligibility(candidato);
    if (!elig.ok) {
        const cutoff = getMinBookingDateTime();
        const cutoffFecha = cutoff.toISOString().split('T')[0];
        const cutoffHora = cutoff.toISOString().split('T')[1].slice(0, 5);
        const error = new Error(`No se puede crear ese turno: ${elig.reason}. La fecha/hora mínima permitida para reservar es ${cutoffFecha} ${cutoffHora}`);
        error.status = 400;
        throw error;
    }

    const turno = await turnosRepository.crearTurno({ fecha, hora });
    return serializeTurno(turno);
}

async function asignarTurnoAdmin({ turnoId, usuarioId, force = false }) {
    if (!turnoId || !usuarioId) {
        const error = new Error('turnoId y usuarioId son obligatorios');
        error.status = 400;
        throw error;
    }

    const result = await turnosRepository.asignarTurnoAdmin({ turnoId, usuarioId, force });

    return {
        turno: serializeTurno(result.turno),
        warnings: result.warnings,
        existingAppointments: Array.isArray(result.existingAppointments)
            ? result.existingAppointments
            : [],
    };
}

async function asignarTurnoAnonimo({ turnoId, nombre, email, telefono }) {
    if (!turnoId || !nombre) {
        const error = new Error('turnoId y nombre son obligatorios');
        error.status = 400;
        throw error;
    }

    const turno = await turnosRepository.asignarTurnoAdminAnonimo({ turnoId, nombre, email, telefono });

    return serializeTurno(turno);
}

async function generarSemana({ fechaInicio, horaInicio, horaFin, intervaloMinutos, diasIncluidos, cantidadDias = 7 }) {
    if (!fechaInicio || !horaInicio || !horaFin || !intervaloMinutos) {
        const error = new Error('Faltan parámetros para generar semana');
        error.status = 400;
        throw error;
    }

    const intervalo = Number(intervaloMinutos);

    if (!Number.isInteger(intervalo) || intervalo < 15) {
        const error = new Error('intervaloMinutos debe ser un número entero mayor o igual a 15');
        error.status = 400;
        throw error;
    }

    const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!formatoHora.test(horaInicio) || !formatoHora.test(horaFin)) {
        const error = new Error('horaInicio y horaFin deben tener formato HH:mm');
        error.status = 400;
        throw error;
    }

    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    const minutosInicio = inicioH * 60 + inicioM;
    const minutosFin = finH * 60 + finM;

    if (minutosFin <= minutosInicio) {
        const error = new Error('horaFin debe ser mayor que horaInicio');
        error.status = 400;
        throw error;
    }

    const dias = diasIncluidos ?? [1, 2, 3, 4, 5, 6];

    if (!Array.isArray(dias) || dias.length === 0 || !dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        const error = new Error('diasIncluidos debe ser un array de números entre 0 y 6');
        error.status = 400;
        throw error;
    }

    const diasUnicos = [...new Set(dias)];
    const totalDias = Number(cantidadDias);

    if (!Number.isInteger(totalDias) || totalDias < 1 || totalDias > 31) {
        const error = new Error('cantidadDias debe ser un número entero entre 1 y 31');
        error.status = 400;
        throw error;
    }

    let creados = 0;
    let omitidos = 0;
    const errores = [];
    const inicio = new Date(fechaInicio + 'T00:00:00');

    if (Number.isNaN(inicio.getTime())) {
        const error = new Error('fechaInicio inválida. Usa formato YYYY-MM-DD');
        error.status = 400;
        throw error;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (inicio < hoy) {
        const error = new Error('No se puede generar semana con fechaInicio en el pasado');
        error.status = 400;
        throw error;
    }

    for (let d = 0; d < totalDias; d++) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + d);
        const diaSemana = dia.getDay();

        if (!diasUnicos.includes(diaSemana)) continue;

        const diaNormalizado = new Date(dia);
        diaNormalizado.setHours(0, 0, 0, 0);

        if (diaNormalizado < hoy) {
            omitidos += Math.ceil((minutosFin - minutosInicio) / intervalo);
            continue;
        }

        const fechaStr = dia.toISOString().split('T')[0];

        let minutosActuales = minutosInicio;

        while (minutosActuales < minutosFin) {
            const hh = String(Math.floor(minutosActuales / 60)).padStart(2, '0');
            const mm = String(minutosActuales % 60).padStart(2, '0');
            const horaStr = `${hh}:${mm}`;

            // Evitar crear slots que no sean reservables según reglas de negocio
            // (p. ej. muy cercanos al ahora). Construimos un objeto candidato y
            // usamos la misma función de clasificación que valida reservas.
            const candidato = {
                fecha: new Date(`${fechaStr}T00:00:00.000Z`),
                hora: new Date(`1970-01-01T${horaStr}:00.000Z`),
            };

            const elig = classifyReservationEligibility(candidato);
            if (!elig.ok) {
                // No es elegible para reserva ahora; omitir su creación
                omitidos++;
                minutosActuales += intervalo;
                continue;
            }

            try {
                await turnosRepository.crearTurno({ fecha: fechaStr, hora: horaStr });
                creados++;
            } catch (e) {
                if (e.status === 409) {
                    omitidos++;
                } else {
                    errores.push(`${fechaStr} ${horaStr}`);
                }
            }

            minutosActuales += intervalo;
        }
    }

    return {
        creados,
        omitidos,
        errores,
        message: `Generación finalizada: ${creados} creados, ${omitidos} omitidos`,
    };
}

async function marcarCortado(turnoId) {
    const turno = await turnosRepository.marcarCortado(turnoId);
    return serializeTurno(turno);
}

async function eliminarTurno(turnoId) {
    return turnosRepository.eliminarTurno(turnoId);
}

module.exports = {
    getDisponibles,
    reservarAnonimo,
    reservarCliente,
    historialCliente,
    cancelarCliente,
    cancelarAdmin,
    getAdminTurnos,
    getMetrics,
    getCancelacionesAdmin,
    crearTurno,
    asignarTurnoAdmin,
    asignarTurnoAnonimo,
    generarSemana,
    marcarCortado,
    eliminarTurno,
};