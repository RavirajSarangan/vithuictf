export function normalizeSriLankaWhatsApp(phone: string): string | null {
  const cleaned = phone.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (!cleaned) return null;

  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (/^947\d{8}$/.test(digits)) return `+${digits}`;
  if (/^07\d{8}$/.test(digits)) return `+94${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `+94${digits}`;

  return null;
}

export function validateSriLankaWhatsApp(phone: string): string | null {
  if (!phone.trim()) return "WhatsApp number is required";
  if (!normalizeSriLankaWhatsApp(phone)) {
    return "Enter a valid Sri Lankan mobile number (e.g. 07X XXX XXXX)";
  }
  return null;
}

export function formatSriLankaWhatsAppDisplay(phone: string): string {
  const normalized = normalizeSriLankaWhatsApp(phone);
  if (!normalized) return phone;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
