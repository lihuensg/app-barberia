export function normalizeWhatsAppPhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  let v = String(phone).trim();
  if (!v) return null;
  let digits = v.replace(/[^\d]/g, '');
  if (!digits) return null;
  digits = digits.replace(/^0+/, '');
  if (digits.startsWith('15') && digits.length > 10) {
    digits = digits.replace(/^15/, '');
  }
  if (digits.startsWith('549') || digits.startsWith('54')) {
    // keep
  } else {
    if (digits.length >= 10 && digits.length <= 11) {
      digits = `549${digits}`;
    } else if (digits.length < 10) {
      return null;
    } else {
      digits = `549${digits}`;
    }
  }
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function isValidWhatsAppPhone(phone: string | undefined | null): boolean {
  return normalizeWhatsAppPhone(phone) !== null;
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const text = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${text}`;
}

export function buildWhatsAppUrlToAdmin(message: string) {
  const admin = import.meta.env.VITE_WHATSAPP_ADMIN_PHONE;
  if (!admin) return null;
  const normalized = normalizeWhatsAppPhone(admin);
  if (!normalized) return null;
  const text = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${text}`;
}
