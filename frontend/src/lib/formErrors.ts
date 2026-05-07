type FieldErrors = Record<string, string>;

function pickMessageFromValidation(errors: any[]): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors.find((e) => typeof e?.message === "string" && e.message.trim()) ?? errors[0];
  return typeof first?.message === "string" && first.message.trim() ? first.message.trim() : null;
}

function extractRaw(error: any): { status?: number; message?: string; errors?: any[] } {
  const status = error?.status ?? error?.response?.status;
  const data = error?.data ?? error?.response?.data;

  return {
    status,
    message:
      data?.message ??
      error?.message ??
      (typeof data === "string" ? data : undefined),
    errors: Array.isArray(data?.errors) ? data.errors : undefined,
  };
}

function mapKnownMessage(input?: string, status?: number): string | null {
  const msg = (input ?? "").toLowerCase();

  if (!msg && status === 429) {
    return "Demasiados intentos. Esperá unos minutos y volvé a intentar.";
  }

  if (msg.includes("credenciales") || msg.includes("email o contraseña")) {
    return "Email o contraseña incorrectos.";
  }

  if (msg.includes("email") && msg.includes("registrad")) {
    return "Ya existe una cuenta con este email.";
  }

  if (msg.includes("token") && (msg.includes("expir") || msg.includes("venc"))) {
    return "El enlace para cambiar la contraseña venció. Solicitá uno nuevo.";
  }

  if (msg.includes("token") && (msg.includes("invál") || msg.includes("inval") || msg.includes("utilizad"))) {
    return "El enlace no es válido o ya fue utilizado.";
  }

  if (msg.includes("turno") && msg.includes("ya fue reservado")) {
    return "El turno ya fue reservado por otra persona.";
  }

  if (msg.includes("ya existe un turno activo asociado a este teléfono")) {
    return "Ya existe un turno activo asociado a este WhatsApp.";
  }

  if (msg.includes("límite") && msg.includes("ip")) {
    return "Se alcanzó el máximo de reservas sin cuenta permitidas desde esta conexión. Probá nuevamente más tarde o comunicate con la barbería.";
  }

  if (msg.includes("no podés reservar un turno que ya pasó")) {
    return "No podés reservar un turno que ya pasó.";
  }

  if (msg.includes("poca anticipación")) {
    return "No podés reservar un turno con tan poca anticipación.";
  }

  if (msg.includes("demasiados intentos") || status === 429) {
    return "Demasiados intentos. Esperá unos minutos y volvé a intentar.";
  }

  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "No pudimos conectar con el servidor. Intentá nuevamente.";
  }

  return null;
}

export function getFieldErrors(error: any): FieldErrors {
  const raw = extractRaw(error);
  const out: FieldErrors = {};

  if (!Array.isArray(raw.errors)) return out;

  for (const item of raw.errors) {
    const field = typeof item?.field === "string" ? item.field : undefined;
    const message = typeof item?.message === "string" ? item.message : undefined;
    if (!field || !message) continue;
    if (!out[field]) out[field] = message;
  }

  return out;
}

export function getErrorMessage(error: any, fallback: string): string {
  const raw = extractRaw(error);
  const fromKnown = mapKnownMessage(raw.message, raw.status);
  if (fromKnown) return fromKnown;

  const fromValidation = pickMessageFromValidation(raw.errors ?? []);
  if (fromValidation) return fromValidation;

  if (typeof raw.message === "string" && raw.message.trim()) {
    return raw.message.trim();
  }

  return fallback;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
