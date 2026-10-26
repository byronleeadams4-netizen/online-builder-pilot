import { config } from './config.ts';

/** Price the customer sees: store shelf price plus Online Builder's markup, rounded to the nearest rand cent. */
export function customerPriceCents(shelfCents: number, markupPct = config.markupPct) {
  return Math.round(shelfCents * (1 + markupPct / 100));
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s()-]/g, '');
  if (/^\+27[6-8]\d{8}$/.test(digits)) return digits;
  if (/^0[6-8]\d{8}$/.test(digits)) return '+27' + digits.slice(1);
  if (/^27[6-8]\d{8}$/.test(digits)) return '+' + digits;
  return null;
}
