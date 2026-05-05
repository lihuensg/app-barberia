const prisma = require('../config/prisma');
const {
    classifyReservationEligibility,
    getCancelCutoffDateTime,
    getMinBookingDateTime,
    getTodayUtcDateOnly,
    getTurnoDateTime,
    normalizeTelefono,
} = require('../utils/turnosBusiness');

const ACTIVE_STATES = ['reservado'];

function parsePositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getUtcDateOnly(value) {
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) return null;

    // Las fechas de negocio se comparan por calendario local de Argentina.
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(dateValue).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = Number(part.value);
        return acc;
    }, {});

    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function getUtcTimeOnly(value) {
    const timeValue = value instanceof Date ? value : new Date(`1970-01-01T${String(value).slice(0, 5)}:00.000Z`);
    if (Number.isNaN(timeValue.getTime())) return null;

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(timeValue).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = Number(part.value);
        return acc;
    }, {});

    return new Date(Date.UTC(
        1970,
        0,
        1,
        parts.hour,
        parts.minute,
        parts.second,
        0,
    ));
}

function buildMinBookingWhere(now = new Date()) {
    const cutoff = getMinBookingDateTime(now);
    const cutoffDate = getUtcDateOnly(cutoff);
    const cutoffTime = getUtcTimeOnly(cutoff);

    return {
        OR: [
            { fecha: { gt: cutoffDate } },
            { fecha: cutoffDate, hora: { gte: cutoffTime } },
        ],
    };
}

function buildActiveFutureWhere({ usuarioId, anonimoTelefono }) {
    const where = {
        estado: { in: ACTIVE_STATES },
        fecha: { gte: getTodayUtcDateOnly() },
    };

    if (usuarioId !== undefined && usuarioId !== null) {
        where.usuarioId = parseInt(usuarioId, 10);
    }

    if (anonimoTelefono) {
        where.anonimoTelefono = anonimoTelefono;
    }

    return where;
}

async function findActiveFutureAppointmentByUser(usuarioId, client = prisma) {
    const turnos = await client.turno.findMany({
        where: buildActiveFutureWhere({ usuarioId }),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });

    const now = new Date();
    return turnos.find((turno) => {
        const turnoDateTime = getTurnoDateTime(turno);
        return turnoDateTime && turnoDateTime.getTime() > now.getTime();
    }) || null;
}

async function findActiveFutureAppointmentByPhone(telefono, client = prisma) {
    const normalizedTelefono = normalizeTelefono(telefono);

    if (!normalizedTelefono) {
        return null;
    }

    const turnos = await client.turno.findMany({
        where: buildActiveFutureWhere({ anonimoTelefono: normalizedTelefono }),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    });

    const now = new Date();
    return turnos.find((turno) => {
        const turnoDateTime = getTurnoDateTime(turno);
        return turnoDateTime && turnoDateTime.getTime() > now.getTime();
    }) || null;
}

async function findActiveFutureAppointmentsByUser(usuarioId, client = prisma) {
    const turnos = await client.turno.findMany({
        where: buildActiveFutureWhere({ usuarioId }),
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        include: {
            usuario: {
                select: { nombre: true, email: true, telefono: true, foto: true },
            },
        },
    });

    const now = new Date();
    return turnos.filter((turno) => {
        const turnoDateTime = getTurnoDateTime(turno);
        return turnoDateTime && turnoDateTime.getTime() > now.getTime();
    });
}

async function asignarTurnoAdmin({ turnoId, usuarioId, force = false }) {
    const id = parseInt(turnoId, 10);
    const userId = parseInt(usuarioId, 10);

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${userId} FOR UPDATE`;

        const activeAppointments = await findActiveFutureAppointmentsByUser(userId, tx);

        if (activeAppointments.length > 0 && !force) {
            const error = new Error('Este cliente ya tiene un turno activo futuro.');
            error.status = 409;
            error.requiresConfirmation = true;
            error.existingAppointments = activeAppointments.map((turno) => ({
                id: turno.id,
                fechaHora: getTurnoDateTime(turno)?.toISOString(),
                estado: turno.estado,
            }));
            throw error;
        }

        const turno = await tx.turno.findUnique({ where: { id } });
            if (!turno) {
                const error = new Error('El turno no existe');
                error.status = 404;
                throw error;
            }

            const eligibility = classifyReservationEligibility(turno);

            if (!eligibility.ok) {
                const error = new Error(
                    eligibility.reason === 'past'
                        ? 'No podés reservar un turno que ya pasó'
                        : 'No podés reservar un turno con tan poca anticipación',
                );
                error.status = 400;
                throw error;
            }

            if (turno.estado !== 'disponible') {
                const error = new Error('El turno ya fue reservado por otra persona');
                error.status = 409;
                throw error;
            }

            const updated = await tx.turno.updateMany({
                where: {
                    id,
                    estado: 'disponible',
                    ...buildMinBookingWhere(),
                },
                data: {
                    estado: 'reservado',
                    usuarioId: userId,
                    anonimoNombre: null,
                    anonimoEmail: null,
                    anonimoTelefono: null,
                },
            });

            if (updated.count === 0) {
                const error = new Error('El turno ya fue reservado por otra persona');
                error.status = 409;
                throw error;
            }

            const assigned = await tx.turno.findUnique({
                where: { id },
                include: {
                    usuario: {
                        select: { nombre: true, email: true, telefono: true, foto: true },
                    },
                },
            });

            return {
                turno: assigned,
                warnings: activeAppointments.length > 0,
                existingAppointments: activeAppointments,
            };
    });
}

async function getDisponibles({ fechaDesde, fechaHasta, page = 1, limit = 100 }) {
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 100);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {
        estado: 'disponible',
        fecha: { gte: getTodayUtcDateOnly() },
    };

    if (fechaDesde || fechaHasta) {
        where.fecha = {
            ...(fechaDesde ? { gte: new Date(`${fechaDesde}T00:00:00.000Z`) } : {}),
            ...(fechaHasta ? { lte: new Date(`${fechaHasta}T23:59:59.999Z`) } : {}),
        };
    }

    const turnos = await prisma.turno.findMany({
        where,
        orderBy: [
            { fecha: 'asc' },
            { hora: 'asc' },
        ],
    });
    const visibles = turnos.filter((turno) => classifyReservationEligibility(turno).ok);

    return visibles.slice(skip, skip + limitNumber);
}

async function reservarAnonimoAtomico({ turnoId, nombre, email, telefono }) {
    const id = parseInt(turnoId, 10);
    const normalizedTelefono = normalizeTelefono(telefono);

    const turno = await prisma.turno.findUnique({ where: { id } });

    if (!turno) {
        const error = new Error('El turno no existe');
        error.status = 404;
        throw error;
    }

    const eligibility = classifyReservationEligibility(turno);

    if (!eligibility.ok) {
        const error = new Error(
            eligibility.reason === 'past'
                ? 'No podés reservar un turno que ya pasó'
                : 'No podés reservar un turno con tan poca anticipación',
        );
        error.status = 400;
        throw error;
    }

    if (turno.estado !== 'disponible') {
        const error = new Error('El turno ya fue reservado por otra persona');
        error.status = 409;
        throw error;
    }

    if (normalizedTelefono) {
        const existingPhoneAppointment = await findActiveFutureAppointmentByPhone(normalizedTelefono);

        if (existingPhoneAppointment) {
            const error = new Error('Ya existe un turno activo asociado a este teléfono.');
            error.status = 409;
            throw error;
        }
    }

    const updated = await prisma.turno.updateMany({
        where: {
            id,
            estado: 'disponible',
            ...buildMinBookingWhere(),
        },
        data: {
            estado: 'reservado',
            anonimoNombre: nombre,
            anonimoEmail: email || null,
            anonimoTelefono: normalizedTelefono,
            usuarioId: null,
        },
    });

    if (updated.count === 0) {
        const error = new Error('El turno ya fue reservado por otra persona');
        error.status = 409;
        throw error;
    }

    return prisma.turno.findUnique({
        where: { id },
        include: {
            usuario: {
                select: { nombre: true, email: true, telefono: true, foto: true },
            },
        },
    });
}

async function reservarClienteAtomico({ turnoId, usuarioId }) {
    const id = parseInt(turnoId, 10);
    const userId = parseInt(usuarioId, 10);

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM usuarios WHERE id = ${userId} FOR UPDATE`;

        const activeAppointment = await findActiveFutureAppointmentByUser(userId, tx);

        if (activeAppointment) {
            const error = new Error('Ya tenés un turno reservado. Cancelalo o esperá a que finalice para reservar otro.');
            error.status = 409;
            throw error;
        }

        const turno = await tx.turno.findUnique({ where: { id } });

        if (!turno) {
            const error = new Error('El turno no existe');
            error.status = 404;
            throw error;
        }

        const eligibility = classifyReservationEligibility(turno);

        if (!eligibility.ok) {
            const error = new Error(
                eligibility.reason === 'past'
                    ? 'No podés reservar un turno que ya pasó'
                    : 'No podés reservar un turno con tan poca anticipación',
            );
            error.status = 400;
            throw error;
        }

        if (turno.estado !== 'disponible') {
            const error = new Error('El turno ya fue reservado por otra persona');
            error.status = 409;
            throw error;
        }

        const updated = await tx.turno.updateMany({
            where: {
                id,
                estado: 'disponible',
                ...buildMinBookingWhere(),
            },
            data: {
                estado: 'reservado',
                usuarioId: userId,
                anonimoNombre: null,
                anonimoEmail: null,
                anonimoTelefono: null,
            },
        });

        if (updated.count === 0) {
            const error = new Error('El turno ya fue reservado por otra persona');
            error.status = 409;
            throw error;
        }

        return tx.turno.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: { nombre: true, email: true, telefono: true, foto: true },
                },
            },
        });
    });
}

async function historialCliente(usuarioId, { page = 1, limit = 20 } = {}) {
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 20);
    const skip = (pageNumber - 1) * limitNumber;

    return prisma.turno.findMany({
        where: { usuarioId: parseInt(usuarioId, 10) },
        orderBy: [
            { fecha: 'desc' },
            { hora: 'desc' },
        ],
        skip,
        take: limitNumber,
    });
}

async function cancelarCliente(usuarioId, turnoId) {
    const turno = await prisma.turno.findUnique({
        where: { id: parseInt(turnoId, 10) },
    });

    if (!turno) {
        const error = new Error('El turno no existe');
        error.status = 404;
        throw error;
    }

    if (turno.usuarioId !== parseInt(usuarioId, 10)) {
        const error = new Error('No tenés permiso para cancelar este turno');
        error.status = 403;
        throw error;
    }

    if (turno.estado !== 'reservado') {
        const error = new Error(`No podés cancelar un turno en estado ${turno.estado}`);
        error.status = 400;
        throw error;
    }

    const turnoDateTime = getTurnoDateTime(turno);

    if (!turnoDateTime) {
        const error = new Error('El turno tiene una fecha u hora inválida');
        error.status = 400;
        throw error;
    }

    const now = new Date();

    if (turnoDateTime.getTime() <= now.getTime()) {
        const error = new Error('No podés cancelar un turno en el pasado');
        error.status = 400;
        throw error;
    }

    const cancelCutoff = getCancelCutoffDateTime(now);

    if (turnoDateTime.getTime() < cancelCutoff.getTime()) {
        const error = new Error(`No podés cancelar un turno con menos de ${require('../config/env').ENV.CANCEL_MIN_HOURS} horas de anticipación`);
        error.status = 400;
        throw error;
    }

    const updated = await prisma.turno.update({
        where: { id: parseInt(turnoId, 10) },
        data: { estado: 'cancelado' },
    });

    return { updated, previousEstado: turno.estado };
}

async function getAdminTurnos({
    estado,
    fecha,
    fechaDesde,
    fechaHasta,
    cliente,
    page = 1,
    limit = 500,
    sort = 'fecha',
    order = 'asc',
}) {
    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 500);
    const skip = (pageNumber - 1) * limitNumber;

    const orderByMap = {
        fecha: { fecha: order },
        hora: { hora: order },
        estado: { estado: order },
        createdAt: { createdAt: order },
    };

    // Construir filtro de fecha
    let whereFecha;
    if (fecha) {
        // Búsqueda por fecha exacta usando rango diario para evitar problemas de zona horaria
        whereFecha = {
            gte: new Date(`${fecha}T00:00:00.000Z`),
            lte: new Date(`${fecha}T23:59:59.999Z`),
        };
    } else {
        // Búsqueda por rango: por defecto desde hoy en adelante
        const defaultGte = getTodayUtcDateOnly();
        const gteDate = fechaDesde ? new Date(`${fechaDesde}T00:00:00.000Z`) : defaultGte;
        const lteDate = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999Z`) : undefined;
        
        whereFecha = {};
        if (gteDate) whereFecha.gte = gteDate;
        if (lteDate) whereFecha.lte = lteDate;
    }

    const turnos = await prisma.turno.findMany({
        where: {
            ...(estado ? { estado } : {}),
            fecha: whereFecha,
            ...(cliente ? {
                OR: [
                    { usuario: { nombre: { contains: cliente, mode: 'insensitive' } } },
                    { usuario: { email: { contains: cliente, mode: 'insensitive' } } },
                    { anonimoNombre: { contains: cliente, mode: 'insensitive' } },
                    { anonimoTelefono: { contains: cliente, mode: 'insensitive' } },
                ],
            } : {}),
        },
        include: {
            usuario: {
                select: {
                    nombre: true,
                    email: true,
                    telefono: true,
                },
            },
        },
        orderBy: [
            orderByMap[sort] || { fecha: 'asc' },
            { hora: 'asc' },
        ],
        skip,
        take: limitNumber,
    });

    return turnos.map((t) => ({
        ...t,
        cliente_nombre: t.usuario?.nombre,
        cliente_email: t.usuario?.email,
        cliente_telefono: t.usuario?.telefono,
        usuario: undefined,
    }));
}

async function getMetrics() {
    const now = new Date();
    const nowDate = getUtcDateOnly(now);
    const nowTime = getUtcTimeOnly(now);

    // Rango de hoy
    const startOfToday = new Date(Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth(),
        nowDate.getUTCDate(),
        0, 0, 0, 0,
    ));
    const endOfToday = new Date(Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth(),
        nowDate.getUTCDate(),
        23, 59, 59, 999,
    ));

    // Rango de la semana (lunes a domingo)
    const day = nowDate.getUTCDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day; // 0=Sunday, 1=Monday
    const startOfWeek = new Date(nowDate);
    startOfWeek.setUTCDate(nowDate.getUTCDate() + diffToMonday);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    // Rango del mes
    const startOfMonth = new Date(Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth(),
        1,
        0, 0, 0, 0,
    ));
    const endOfMonth = new Date(Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth() + 1,
        0,
        23, 59, 59, 999,
    ));

    const [
        availableNow,
        upcomingReserved,
        cutToday,
        cancelledToday,
        availableToday,
        reservedToday,
        availableWeek,
        reservedWeek,
        cancelledWeek,
        availableMonth,
        reservedMonth,
        cancelledMonth,
        cutWeek,
        cutMonth,
        clientsTotal,
        postsTotal,
        proximosTurnos,
    ] = await Promise.all([
        // Disponibles ahora
        prisma.turno.count({
            where: {
                estado: 'disponible',
                OR: [
                    { fecha: { gt: nowDate } },
                    { AND: [{ fecha: nowDate }, { hora: { gte: nowTime } }] },
                ],
            },
        }),
        // Reservados próximos
        prisma.turno.count({
            where: {
                estado: 'reservado',
                OR: [
                    { fecha: { gt: nowDate } },
                    { AND: [{ fecha: nowDate }, { hora: { gte: nowTime } }] },
                ],
            },
        }),
        // Cortados hoy
        prisma.turno.count({
            where: {
                estado: 'cortado',
                fecha: { gte: startOfToday, lte: endOfToday },
            },
        }),
        // Cancelados hoy
        prisma.turno.count({
            where: {
                estado: 'cancelado',
                fecha: { gte: startOfToday, lte: endOfToday },
            },
        }),
        // Disponibles hoy (desde ahora hasta fin del día)
        prisma.turno.count({
            where: {
                estado: 'disponible',
                fecha: { gte: nowDate, lte: endOfToday },
                hora: nowDate.getUTCDate() === nowDate.getUTCDate()
                    ? { gte: nowTime }
                    : undefined,
            },
        }),
        // Reservados hoy (desde ahora hasta fin del día)
        prisma.turno.count({
            where: {
                estado: 'reservado',
                fecha: { gte: nowDate, lte: endOfToday },
                hora: nowDate.getUTCDate() === nowDate.getUTCDate()
                    ? { gte: nowTime }
                    : undefined,
            },
        }),
        // Disponibles semana
        prisma.turno.count({
            where: {
                estado: 'disponible',
                fecha: { gte: startOfWeek, lte: endOfWeek },
            },
        }),
        // Reservados semana
        prisma.turno.count({
            where: {
                estado: 'reservado',
                fecha: { gte: startOfWeek, lte: endOfWeek },
            },
        }),
        // Cancelados semana
        prisma.turno.count({
            where: {
                estado: 'cancelado',
                fecha: { gte: startOfWeek, lte: endOfWeek },
            },
        }),
        // Disponibles mes
        prisma.turno.count({
            where: {
                estado: 'disponible',
                fecha: { gte: startOfMonth, lte: endOfMonth },
            },
        }),
        // Reservados mes
        prisma.turno.count({
            where: {
                estado: 'reservado',
                fecha: { gte: startOfMonth, lte: endOfMonth },
            },
        }),
        // Cancelados mes
        prisma.turno.count({
            where: {
                estado: 'cancelado',
                fecha: { gte: startOfMonth, lte: endOfMonth },
            },
        }),
        // Cortados semana
        prisma.turno.count({
            where: {
                estado: 'cortado',
                fecha: { gte: startOfWeek, lte: endOfWeek },
            },
        }),
        // Cortados mes
        prisma.turno.count({
            where: {
                estado: 'cortado',
                fecha: { gte: startOfMonth, lte: endOfMonth },
            },
        }),
        // Clientes total
        prisma.usuario.count({ where: { rol: 'cliente' } }),
        // Posts activos total (excluye soft-delete)
        prisma.post.count({ where: { deletedAt: null } }),
        // Próximos turnos reservados
        prisma.turno.findMany({
            where: {
                estado: 'reservado',
                OR: [
                    { fecha: { gt: nowDate } },
                    { AND: [{ fecha: nowDate }, { hora: { gte: nowTime } }] },
                ],
            },
            orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
            take: 5,
            include: {
                usuario: {
                    select: { nombre: true, email: true, telefono: true, foto: true },
                },
            },
        }),
    ]);

    return {
        // Métricas principales
        availableNow,
        upcomingReserved,
        cutToday,
        cancelledToday,
        // Métricas de hoy
        today: {
            available: availableToday,
            reserved: reservedToday,
            cut: cutToday,
            cancelled: cancelledToday,
        },
        // Métricas de semana
        week: {
            available: availableWeek,
            reserved: reservedWeek,
            cut: cutWeek,
            cancelled: cancelledWeek,
        },
        // Métricas de mes
        month: {
            available: availableMonth,
            reserved: reservedMonth,
            cut: cutMonth,
            cancelled: cancelledMonth,
        },
        // Totales
        clientsTotal,
        postsTotal,
        // Próximos turnos
        upcomingAppointments: proximosTurnos,
    };

        }

async function crearTurno({ fecha, hora }) {
    const fechaTurno = new Date(`${fecha}T00:00:00.000Z`);

    if (Number.isNaN(fechaTurno.getTime())) {
        const error = new Error('Fecha inválida. Usa formato YYYY-MM-DD');
        error.status = 400;
        throw error;
    }

    const today = getTodayUtcDateOnly();

    if (fechaTurno < today) {
        const error = new Error('No se puede crear un turno en una fecha pasada');
        error.status = 400;
        throw error;
    }

    const matchHora = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);

    if (!matchHora) {
        const error = new Error('Formato de hora inválido. Usa HH:mm');
        error.status = 400;
        throw error;
    }

    const turnoExistente = await prisma.turno.findFirst({
        where: {
            fecha: fechaTurno,
            hora: new Date(`1970-01-01T${hora}:00.000Z`),
        },
    });

    if (turnoExistente) {
        const error = new Error('Ya existe un turno para esa fecha y hora');
        error.status = 409;
        throw error;
    }

    return prisma.turno.create({
        data: {
            fecha: fechaTurno,
            hora: new Date(`1970-01-01T${hora}:00.000Z`),
            estado: 'disponible',
        },
    });
}

async function marcarCortado(turnoId) {
    const turno = await prisma.turno.findUnique({
        where: { id: parseInt(turnoId, 10) },
    });

    if (!turno) {
        const error = new Error('Turno no encontrado');
        error.status = 404;
        throw error;
    }

    const ALLOWED_CORTADO_STATES = ['reservado', 'confirmado', 'pendiente'];

    if (!ALLOWED_CORTADO_STATES.includes(String(turno.estado))) {
        const error = new Error('Este turno no puede marcarse como cortado por su estado actual.');
        error.status = 400;
        throw error;
    }

    // Combinar fecha + hora del turno y comparar con el ahora real
    const turnoDateTime = getTurnoDateTime(turno);
    if (!turnoDateTime) {
        const error = new Error('Fecha/hora del turno inválida');
        error.status = 400;
        throw error;
    }

    const now = new Date();
    if (turnoDateTime.getTime() > now.getTime()) {
        const error = new Error('No podés marcar como cortado un turno que todavía no ocurrió.');
        error.status = 400;
        throw error;
    }

    return prisma.turno.update({
        where: { id: parseInt(turnoId, 10) },
        data: { estado: 'cortado' },
    });
}

async function eliminarTurno(turnoId) {
    const turno = await prisma.turno.findUnique({
        where: { id: parseInt(turnoId, 10) },
    });

    if (!turno) {
        const error = new Error('Turno no encontrado');
        error.status = 404;
        throw error;
    }

    if (turno.estado === 'cancelado' || turno.estado === 'cortado') {
        const error = new Error(`No se puede eliminar un turno en estado ${turno.estado}`);
        error.status = 409;
        throw error;
    }

    return prisma.turno.delete({
        where: { id: parseInt(turnoId, 10) },
    });
}

module.exports = {
    getDisponibles,
    reservarAnonimoAtomico,
    reservarClienteAtomico,
    historialCliente,
    cancelarCliente,
    asignarTurnoAdmin,
    getAdminTurnos,
    getMetrics,
    crearTurno,
    marcarCortado,
    eliminarTurno,
    findActiveFutureAppointmentByUser,
    findActiveFutureAppointmentsByUser,
    findActiveFutureAppointmentByPhone,
};
