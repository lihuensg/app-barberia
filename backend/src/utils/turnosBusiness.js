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

    const value = String(telefono).trim();
    if (!value) return null;

    const hasPlus = value.startsWith('+');
    const digits = value.replace(/[^\d]/g, '');

    if (!digits) return null;

    return hasPlus ? `+${digits}` : digits;
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