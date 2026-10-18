/** Digits only, with India's +91 added to 10-digit numbers. */
export const normalizePhone = (phone: string | null | undefined): string => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
};

export const telHref = (phone: string | null | undefined): string => `tel:+${normalizePhone(phone)}`;

export const whatsappHref = (phone: string | null | undefined, text?: string): string =>
  `https://wa.me/${normalizePhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
