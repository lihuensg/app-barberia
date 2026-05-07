const { ENV } = require('../config/env');

const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function getZonedParts(date, timeZone = BUSINESS_TIME_ZONE) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const values = {};

    for (const part of parts) {
        if (part.type !== 'literal') {
            values[part.type] = Number(part.value);
        }
    }

    return values;
}

function toComparableDate(parts) {
    return new Date(Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour || 0,
        parts.minute || 0,
        parts.second || 0,
        parts.millisecond || 0,
    ));
}

function getBusinessComparableNow(now = new Date()) {
    return toComparableDate(getZonedParts(now));
}

function normalizeTelefono(telefono) {
    if (!telefono) return null;

    let value = String(telefono).trim();
    if (!value) return null;

    // Eliminar caracteres no numéricos
    let digits = value.replace(/[^\d]/g, '');
    if (!digits) return null;

    // Eliminar ceros a la izquierda
    digits = digits.replace(/^0+/, '');

    // Si comienza con '15' (prefijo antiguo móvil local), quitarlo
    if (digits.startsWith('15') && digits.length > 10) {
        digits = digits.replace(/^15/, '');
    }

    // Si ya contiene el código de país 54 o 549, dejarlo
    if (digits.startsWith('549') || digits.startsWith('54')) {
        // OK
    } else {
        // Si tiene 10 dígitos (ej: 3435551234) o entre 10 y 11, asumimos Argentina y agregamos 549
        if (digits.length >= 10 && digits.length <= 11) {
            digits = `549${digits}`;
        } else if (digits.length < 10) {
            // demasiado corto
            return null;
        } else {
            // Para otros largos, prefijar 549 como fallback
            digits = `549${digits}`;
        }
    }

    // Validar que ahora sean solo números y longitud razonable
    if (!/^\d+$/.test(digits)) return null;
    if (digits.length < 10 || digits.length > 15) return null;

    return digits;
}

function toUtcDateTime(fecha, hora) {
    const fechaValue = fecha instanceof Date ? fecha : new Date(fecha);
    const horaValue = hora instanceof Date
        ? hora
        : new Date(`1970-01-01T${String(hora).slice(0, 5)}:00.000Z`);

    if (Number.isNaN(fechaValue.getTime()) || Number.isNaN(horaValue.getTime())) {
        return null;
    }

    return new Date(Date.UTC(
        fechaValue.getUTCFullYear(),
        fechaValue.getUTCMonth(),
        fechaValue.getUTCDate(),
        horaValue.getUTCHours(),
        horaValue.getUTCMinutes(),
        horaValue.getUTCSeconds(),
        horaValue.getUTCMilliseconds(),
    ));
}

function getMinBookingDateTime(now = new Date()) {
    return new Date(getBusinessComparableNow(now).getTime() + (ENV.MIN_BOOKING_NOTICE_MINUTES * 60 * 1000));
}

function getTodayUtcDateOnly(now = new Date()) {
    const parts = getZonedParts(now);
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function getCancelCutoffDateTime(now = new Date()) {
    return new Date(getBusinessComparableNow(now).getTime() + (ENV.CANCEL_MIN_HOURS * 60 * 60 * 1000));
}

function isActiveTurnoState(estado) {
    return ['reservado', 'confirmado', 'pendiente'].includes(String(estado || '').toLowerCase());
}

function getTurnoDateTime(turno) {
    if (!turno) return null;
    return toUtcDateTime(turno.fecha, turno.hora);
}

function isReservableTurno(turno, now = new Date()) {
    const turnoDateTime = getTurnoDateTime(turno);
    if (!turnoDateTime) return false;
    return turnoDateTime.getTime() >= getMinBookingDateTime(now).getTime();
}

function classifyReservationEligibility(turno, now = new Date()) {
    const turnoDateTime = getTurnoDateTime(turno);
    const businessNow = getBusinessComparableNow(now);

    if (!turnoDateTime) {
        return { ok: false, reason: 'invalid' };
    }

    if (turnoDateTime.getTime() <= businessNow.getTime()) {
        return { ok: false, reason: 'past' };
    }

    const cutoff = getMinBookingDateTime(now);
    if (turnoDateTime.getTime() < cutoff.getTime()) {
        return { ok: false, reason: 'too_soon' };
    }

    return { ok: true, reason: 'ok' };
}

module.exports = {
    normalizeTelefono,
    toUtcDateTime,
    getBusinessComparableNow,
    getMinBookingDateTime,
    getTodayUtcDateOnly,
    getCancelCutoffDateTime,
    isActiveTurnoState,
    getTurnoDateTime,
    isReservableTurno,
    classifyReservationEligibility,
};